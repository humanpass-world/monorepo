#!/bin/bash

check_openssl() {
    if ! command -v openssl &> /dev/null; then
        echo "❌ OpenSSL is not installed or not in PATH"
        echo ""
        echo "To install OpenSSL, run:"
        echo "  brew install openssl"
        echo ""
        echo "After installation, you may need to add it to your PATH:"
        echo "  echo 'export PATH=\"/opt/homebrew/opt/openssl@3/bin:\$PATH\"' >> ~/.zshrc"
        echo "  source ~/.zshrc"
        echo ""
        exit 1
    fi
}

check_openssl

PUBLIC_KEY="-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA1UO9J0yWtd/Da2+wj3nw
JbTFs2DevyxYXT2KDAZdkqgX7HSXfq2W2n65Tvtb2nc1maE8Kb7fPRSKx5Ffsk+/
gpvl1JnkF4e3MfURLOqyuSx7wpbWlMAmh7EII6ciWgQsRtM6f8EB2p1V5pVSHD/p
JsVNbmHgdmad8ZNZtL2FcarkfLHL1DfPctFW6Kn3k97WP0zFznorKbzD8EfvvfLn
UCapndJ7aktNCNc5I/aB9oAWVILYoNJzYWXppgk97lryXZaQ0pYhalQDgO7vDAIb
GKD1/1YtL9N0G4Pz316NCZRdoTvmokKWiR38iSmNuwm0HyJAZjuA+4oR1rD65T76
f67Ys2ZKZjOeq95vE3kxHtaEXTZI+TIKsrrfFRrP+vZ24luOvHQqYvqT5vno9jGl
5VIWRSfw80/FCgLU7r5xMUdJnD+vPjC7WACFSJ03tAmZX9zDCaMd1hvczhD+WMdv
6qqb2NHm1IpB+NbNp1UdgoWEy8zs11qx7LyeQEF91LrE/H8Rhv3E40ZGkSnjwXXt
NPQo2xEnzQg6sGeEsqkj/wbbDz1b1TQqqWPCJEIw1lr103Li1vDiGohoLKwTuoDd
G9mOtp1+4SFvZEseKf1jECCwukcQ4vYSU48tcVwYALobBMJnqCWsz3hX82DVL6u0
o/jg+LU1j2/MBY5ICvO1eLECAwEAAQ==
-----END PUBLIC KEY-----"

if [ "$1" == "encrypt" ]; then
    if [ -f "env.jsonc" ]; then
        INPUT_FILE="env.jsonc"
    else
        echo "❌ No environment file found. Looking for env.jsonc in directory"
        exit 1
    fi
    AES_KEY=$(openssl rand -hex 32)
    echo "$AES_KEY" | openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "$INPUT_FILE" -out ./env.jsonc.enc -pass stdin
    
    echo "$PUBLIC_KEY" > /tmp/public_key.pem
    echo "$AES_KEY" | openssl pkeyutl -encrypt -pubin -inkey /tmp/public_key.pem > ./env.jsonc.key.enc
    rm /tmp/public_key.pem
    
    echo "✅ File encrypted successfully"
    echo "   - ./env.jsonc.enc (encrypted file)"
    echo "   - ./env.jsonc.key.enc (encrypted AES key)"
elif [ "$1" == "decrypt" ]; then
    if [ ! -f "./decrypt.pem" ]; then
        echo "❌ ./decrypt.pem file not found."
        exit 1
    fi
    
    if [ ! -f "./env.jsonc.enc" ] || [ ! -f "./env.jsonc.key.enc" ]; then
        echo "❌ Encrypted files not found. Run 'encrypt' first."
        exit 1
    fi
    
    AES_KEY=$(openssl pkeyutl -decrypt -inkey ./decrypt.pem -in ./env.jsonc.key.enc 2>/dev/null)
    if [ $? -ne 0 ] || [ -z "$AES_KEY" ]; then
        echo "❌ Failed to decrypt AES key. The private key may be incorrect or corrupted."
        exit 1
    fi
    
    echo "$AES_KEY" | openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 -in ./env.jsonc.enc -out ./env.jsonc -pass stdin 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "❌ Failed to decrypt file. The data may be corrupted or the key is incorrect."
        exit 1
    fi
    
    echo "✅ File decrypted successfully"
fi

