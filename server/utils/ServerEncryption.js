const crypto = require('crypto');

function deriveKey(sharedSecret) {
        return crypto.createHmac('sha256', sharedSecret)
                    .digest('hex')
                    .slice(0, 32);
    }

function serverEncrypt(data, sharedSecret) {
        const key = deriveKey(sharedSecret);
        console.log("Derived Key is "+ key);
        const iv = crypto.randomBytes(12);
        console.log(`iv is ` + iv);

        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
        cipher.setAutoPadding(false);
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            encrypted: encrypted,
            authTag: authTag.toString('hex')
        };
    }

module.exports = { deriveKey, serverEncrypt };