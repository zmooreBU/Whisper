const crypto = require('crypto');
const { serverEncrypt } = require('../utils/ServerEncryption');

const {
    BAD_REQUEST,
    OK,
    INTERNAL_SERVER_ERROR,
  } = require('../httpStatusCodes');

class ServerKeyExchange {
    constructor() {
        this.serverKeyPair = null;
        this.sharedSecret = null;
    }

    generateServerKeyPair() {
        this.serverKeyPair = crypto.createECDH('prime256v1');
        this.serverKeyPair.generateKeys();
        return this.serverKeyPair;
    }

    async keyExchangeHandler(req, res) {
        if (!this.serverKeyPair) {
            this.generateServerKeyPair();
        }

        try {
            const clientPublicKey = Buffer.from(
                req.body.clientPublicKey,
                'hex'
            );

            const sharedSecret = this.serverKeyPair.computeSecret(clientPublicKey, 'hex', 'hex');
            console.log(`Shared secret is ${sharedSecret}`);
            this.sharedSecret = sharedSecret;

            res.json({
                serverPublicKey: this.serverKeyPair.getPublicKey('hex'),
                status: 'success'
            })

        } catch (error) {
            console.error('Server key exchange error:', error);
            res.status(500).json({error: 'Key exchange failed'});
        }
    }

    setupRoutes(app) {
        app.post('/key-exchange', this.keyExchangeHandler.bind(this));
    }
}

module.exports = ServerKeyExchange;