import { hex2arr, buf2Hex } from './utils';

class SecureKeyExchange {
    constructor() {
        this.serverPublicKey = null;
        this.clientKeyPair = null;
        this.sharedSecret = null;
        this.sharedKey = null;
    }

    //Generate the client-side key pair and store it in this.clientKeyPair.
    async generateClientKeyPair() {
        this.clientKeyPair = await window.crypto.subtle.generateKey(
            {
                name: 'ECDH',
                namedCurve: 'P-256'
            },
            true,
            ['deriveKey', 'deriveBits']
        );
        return this.clientKeyPair;
    }

    //export the client public key from the store client key pair
    async exportPublicKey() {
        const publicKey = await window.crypto.subtle.exportKey(
            'raw',
            this.clientKeyPair.publicKey
        );
        const publicKeyHex = buf2Hex(publicKey);
        return publicKeyHex;
    }

    //derive the shared secret and shared key from the server public key
    async deriveSharedSecret() {
        const importedServerPublicKey = await window.crypto.subtle.importKey(
            'raw',
            this.serverPublicKey,
            {
                name: 'ECDH',
                namedCurve: 'P-256'
            },
            true,
            []
        );

        this.sharedSecret = await window.crypto.subtle.deriveBits(
            {
                name:'ECDH',
                public: importedServerPublicKey,
                private: this.clientKeyPair.privateKey 
            },
            this.clientKeyPair.privateKey,
            256
        );

        console.log(`SharedSecret is `, buf2Hex(this.sharedSecret));

        this.sharedKey = await window.crypto.subtle.importKey(
            'raw',
            this.sharedSecret,
            { name: 'AES-GCM' },
            false,
            ['encrypt', 'decrypt']
        );
        return this.sharedKey;
    }

    async initiateKeyExchange(api) {
        if (!this.clientKeyPair) {
            await this.generateClientKeyPair();
        }

        const clientPublicKeyBase64 = await this.exportPublicKey();
        try {
            const response = await api.post('/key-exchange', {
                clientPublicKey: clientPublicKeyBase64
            });

            const serverPublicKeyHex = response.data.serverPublicKey;
            

            this.serverPublicKey = hex2arr(serverPublicKeyHex);
            await this.deriveSharedSecret();
            
            /* Trying to decrypt data sent from the server
            const test = response.data.test;
            window.crypto.subtle.decrypt(
                {
                    name:'AES-GCM',
                    iv: hex2arr(test.iv)
                },
                this.sharedKey,
                hex2arr(test.encrypted + test.authTag)
            ).then ((decrypted) => {
                console.log("decryption test is" + decrypted);
            }).catch((err) => {
                console.error(err);
            });*/

        } catch(error) {
            console.error('Key exchange failed:', error);
            throw error;
        }
    }    
}

export { SecureKeyExchange }

            //test that I can exncrypt and decrypt with sharedKey
            /*const iv = window.crypto.getRandomValues(new Uint8Array(12));
            window.crypto.subtle.encrypt(
                {
                    name: 'AES-GCM',
                    iv: iv,
                },
                this.sharedKey,
                new TextEncoder().encode("help")
            ).then((encrypted) => {
                return window.crypto.subtle.decrypt(
                    {
                        name:'AES-GCM',
                        iv: iv
                    },
                    this.sharedKey,
                    encrypted
                )}
            ).then((decrypted)=> {
                console.log(`encrypted test is ${new TextDecoder().decode(decrypted)}`);
            }).catch((err) => {
                console.error(err);
            });*/