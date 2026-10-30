"""Signs an APK with APK Signature Scheme v2 (Android 7 and later), RSA with SHA-256.

The Android build tools cannot be downloaded where the APK is signed, so this follows the published scheme
(source.android.com/docs/security/features/apksigning/v2) with the `cryptography` package. The key never goes into the
public repository: the APK is built unsigned on GitHub (.github/workflows/apk.yml) and signed here.

Usage: python3 scripts/apk/sign-apk.py <unsigned.apk> <signed.apk> <keystore.p12> <password>
The keystore is PKCS#12, e.g. from: keytool -genkeypair -storetype PKCS12 -keyalg RSA -keysize 2048 -validity 10950 ...
"""
import hashlib
import struct
import sys

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import pkcs12

V2_ID = 0x7109871A
RSA_SHA256 = 0x0103
MAGIC = b"APK Sig Block 42"
CHUNK = 1024 * 1024


def lp(data: bytes) -> bytes:
    """A uint32 little-endian length, then the data."""
    return struct.pack("<I", len(data)) + data


def find_eocd(apk: bytes) -> int:
    for at in range(len(apk) - 22, max(-1, len(apk) - 22 - 65536), -1):
        if apk[at : at + 4] == b"PK\x05\x06" and struct.unpack_from("<H", apk, at + 20)[0] == len(apk) - at - 22:
            return at
    raise SystemExit("not a zip file")


def digest(parts: list[bytes]) -> bytes:
    chunks = []
    for part in parts:
        for at in range(0, len(part), CHUNK):
            piece = part[at : at + CHUNK]
            chunks.append(hashlib.sha256(b"\xa5" + struct.pack("<I", len(piece)) + piece).digest())
    return hashlib.sha256(b"\x5a" + struct.pack("<I", len(chunks)) + b"".join(chunks)).digest()


def main() -> None:
    src, dst, store, password = sys.argv[1:5]
    apk = open(src, "rb").read()
    eocd_at = find_eocd(apk)
    cd_size, cd_at = struct.unpack_from("<II", apk, eocd_at + 12)
    if apk[cd_at - 16 : cd_at] == MAGIC:
        raise SystemExit("already signed")
    entries, cd, eocd = apk[:cd_at], apk[cd_at : cd_at + cd_size], apk[eocd_at:]

    key, cert, _ = pkcs12.load_key_and_certificates(open(store, "rb").read(), password.encode())
    cert_der = cert.public_bytes(serialization.Encoding.DER)
    public = key.public_key().public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)

    # The EOCD is digested as it is: its central directory offset already points where the signing block will start.
    content = digest([entries, cd, eocd])
    signed = lp(lp(struct.pack("<I", RSA_SHA256) + lp(content))) + lp(lp(cert_der)) + lp(b"")
    signature = key.sign(signed, padding.PKCS1v15(), hashes.SHA256())
    signer = lp(signed) + lp(lp(struct.pack("<I", RSA_SHA256) + lp(signature))) + lp(public)
    value = lp(lp(signer))

    pair = struct.pack("<Q", 4 + len(value)) + struct.pack("<I", V2_ID) + value
    size = len(pair) + 8 + 16
    block = struct.pack("<Q", size) + pair + struct.pack("<Q", size) + MAGIC

    eocd = bytearray(eocd)
    struct.pack_into("<I", eocd, 16, cd_at + len(block))
    with open(dst, "wb") as out:
        out.write(entries + block + cd + bytes(eocd))


main()
