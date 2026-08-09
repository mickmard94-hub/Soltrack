<?php

namespace App\Services;

class TotpService
{
    private static string $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    public static function genererSecret(int $longueur = 16): string
    {
        $secret = '';
        for ($i = 0; $i < $longueur; $i++) {
            $secret .= self::$alphabet[random_int(0, 31)];
        }
        return $secret;
    }

    private static function base32Decode(string $secret): string
    {
        $secret = strtoupper($secret);
        $bits = '';
        foreach (str_split($secret) as $char) {
            $pos = strpos(self::$alphabet, $char);
            if ($pos === false) continue;
            $bits .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }
        $bytes = '';
        foreach (str_split($bits, 8) as $byte) {
            if (strlen($byte) < 8) continue;
            $bytes .= chr(bindec($byte));
        }
        return $bytes;
    }

    public static function genererCode(string $secret, ?int $timestamp = null): string
    {
        $timestamp = $timestamp ?? time();
        $compteur = intdiv($timestamp, 30);
        $binaireCompteur = pack('N*', 0) . pack('N*', $compteur);

        $cleBinaire = self::base32Decode($secret);
        $hachage = hash_hmac('sha1', $binaireCompteur, $cleBinaire, true);

        $offset = ord($hachage[19]) & 0xf;
        $code = (
            ((ord($hachage[$offset]) & 0x7f) << 24) |
            ((ord($hachage[$offset + 1]) & 0xff) << 16) |
            ((ord($hachage[$offset + 2]) & 0xff) << 8) |
            (ord($hachage[$offset + 3]) & 0xff)
        ) % 1000000;

        return str_pad((string) $code, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Vérifie un code en tolérant une fenêtre de +/- 30s (contre les
     * décalages d'horloge légers entre le téléphone et le serveur).
     */
    public static function verifier(string $secret, string $code, int $fenetre = 1): bool
    {
        $timestampActuel = time();
        for ($i = -$fenetre; $i <= $fenetre; $i++) {
            $codeAttendu = self::genererCode($secret, $timestampActuel + ($i * 30));
            if (hash_equals($codeAttendu, $code)) {
                return true;
            }
        }
        return false;
    }

    /**
     * URI standard "otpauth://" que toute application d'authentification
     * (Google Authenticator, Authy, etc.) sait scanner via QR code.
     */
    public static function genererUri(string $secret, string $email, string $emetteur = 'Sol Ansanm'): string
    {
        $label = rawurlencode("{$emetteur}:{$email}");
        $emetteurEncode = rawurlencode($emetteur);
        return "otpauth://totp/{$label}?secret={$secret}&issuer={$emetteurEncode}&algorithm=SHA1&digits=6&period=30";
    }
}