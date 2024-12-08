const CodeRouter = require('express').Router();
const {
  BAD_REQUEST,
  OK,
  INTERNAL_SERVER_ERROR,
} = require('../httpStatusCodes');
const { MailtrapClient } = require('mailtrap');
const { emailValidator } = require('../utils/helper');
const OTP = require('../models/OTPModel');

const TOKEN = process.env.MAILTRAP_TOKEN;
const ENDPOINT = 'https://send.api.mailtrap.io/';

const client = new MailtrapClient({ endpoint: ENDPOINT, token: TOKEN });
const sender = {
  email: process.env.MAILTRAP_EMAIL,
  name: 'Whisper',
};

function generateCode() {
	const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let result = '';
	const charactersLength = characters.length;

	for (let i = 0; i < 6; i++) {
		result += characters.charAt(Math.floor(Math.random() * charactersLength));
	}

	return result;
}

async function createOTP(email) {
  const oldOTP = await OTP.findOne({email});
  if (oldOTP) {
    await oldOTP.deleteOne();
  }
  passcode = generateCode();
  const otp = new OTP({
    email,
    otp: passcode
  });
  await otp.save();
  return passcode;

}

const sendCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res
      .status(BAD_REQUEST)
      .json({ message: `Email or Code is missing` });
  }

  const passcode = await createOTP(email);

  const recipients = [
    {
      email,
    },
  ];

  client
    .send({
      from: sender,
      to: recipients,
      subject: 'Your Whisper Verfication Code',
      text: passcode,
    })
    .then(() => {
      console.log('success');
      return res.status(OK).json({ message: `Code Sent To Email` });
    })
    .catch((err) => {
      console.error(err);
      return res.status(INTERNAL_SERVER_ERROR).json({ error: err });
    });
};

CodeRouter.route('/').post(emailValidator, sendCode);

module.exports = CodeRouter;

