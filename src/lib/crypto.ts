/**
 * 暗号化・ハッシュユーティリティ
 * APIキーの暗号化とパスワードのハッシュ化を提供
 */
import crypto from "crypto";

const IV_LENGTH = 16;

/**
 * 暗号化キーを取得
 * @throws 環境変数が設定されていない場合
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  return Buffer.from(key, "hex");
}

/**
 * テキストをAES-256-CBCで暗号化
 * @param text 平文
 * @returns 暗号化された文字列（IV:暗号文 形式）
 */
export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * AES-256-CBCで暗号化されたテキストを復号
 * @param encryptedText 暗号化された文字列（IV:暗号文 形式）
 * @returns 復号された平文
 */
export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const [ivHex, encrypted] = encryptedText.split(":");
  if (!ivHex || !encrypted) {
    throw new Error("Invalid encrypted text format");
  }
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * パスワードをSHA-256でハッシュ化
 * @param password 平文パスワード
 * @returns ハッシュ値（16進数文字列）
 */
export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

/**
 * パスワードを検証
 * @param password 検証する平文パスワード
 * @param hash 保存されているハッシュ値
 * @returns 一致する場合true
 */
export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

/**
 * APIキーをマスク表示用に変換
 * @param apiKey APIキー
 * @returns マスクされた文字列（例: "sk-xxx...xxx"）
 */
export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return "***";
  }
  return apiKey.slice(0, 4) + "..." + apiKey.slice(-4);
}
