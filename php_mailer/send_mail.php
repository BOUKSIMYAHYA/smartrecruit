<?php
/**
 * SmartRecruit ATS - PHPMailer Bridge
 * Sends real emails via Gmail SMTP using PHPMailer
 * Featuring EST Casablanca branding (#004b82 / #868889 / #ffffff)
 */

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/PHPMailer/src/Exception.php';
require_once __DIR__ . '/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/PHPMailer/src/SMTP.php';

header('Content-Type: application/json; charset=utf-8');

// Read input (either from base64 CLI argument, raw CLI argument, STDIN, or HTTP POST)
$rawInput = '';
if (isset($argv[1])) {
    $arg = $argv[1];
    $decoded = base64_decode($arg, true);
    if ($decoded && json_decode($decoded, true)) {
        $rawInput = $decoded;
    } else {
        $rawInput = $arg;
    }
} else {
    $rawInput = file_get_contents('php://stdin');
    if (empty($rawInput)) {
        $rawInput = file_get_contents('php://input');
    }
}

$data = json_decode($rawInput, true);

if (!$data || empty($data['to'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Destinataire manquant ou JSON invalide.'
    ]);
    exit(1);
}

$toInput = $data['to'];
$name = isset($data['name']) ? trim($data['name']) : 'Candidat';
$code = isset($data['code']) ? trim($data['code']) : '';
$subject = isset($data['subject']) ? $data['subject'] : "Code de vérification EST Casablanca : $code";
$customBody = isset($data['htmlBody']) ? $data['htmlBody'] : null;
$attachmentPath = isset($data['attachmentPath']) ? $data['attachmentPath'] : null;
$attachmentName = isset($data['attachmentName']) ? $data['attachmentName'] : 'CV_Candidat.pdf';

// Default HTML Template if none provided
if (!$customBody) {
    $customBody = '
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: "Segoe UI", Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 25px 15px; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e5e7; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .top-stripe { height: 6px; background-color: #004b82; }
            .header { padding: 24px 20px 18px 20px; text-align: center; border-bottom: 1px solid #e2e5e7; background-color: #ffffff; }
            .header h1 { margin: 8px 0 2px; font-size: 15px; font-weight: 800; color: #004b82; letter-spacing: 0.5px; text-transform: uppercase; }
            .header p { margin: 0; font-size: 11px; color: #868889; font-weight: 600; }
            .content { padding: 30px 28px; }
            .greeting { font-size: 15px; font-weight: 700; color: #004b82; margin-bottom: 12px; }
            .code-box { background: #f8f9fa; border: 2px dashed #004b82; border-radius: 12px; padding: 20px; text-align: center; margin: 25px 0; }
            .code-value { font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #004b82; font-family: "Courier New", monospace; }
            .footer { background: #f8f9fa; padding: 18px; text-align: center; font-size: 11px; color: #868889; border-top: 1px solid #e2e5e7; line-height: 1.5; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="top-stripe"></div>
            <div class="header">
                <img src="cid:estc_logo" alt="EST Casablanca" style="height: 52px; width: auto; margin-bottom: 6px;" />
                <h1>École Supérieure de Technologie de Casablanca</h1>
                <p>Université Hassan II de Casablanca &bull; SMARTRECRUIT ATS</p>
            </div>
            <div class="content">
                <div class="greeting">Bonjour ' . htmlspecialchars($name) . ',</div>
                <p style="font-size: 13px; line-height: 1.6; color: #374151;">
                    Merci de votre démarche sur le portail de recrutement de l\'<strong>École Supérieure de Technologie de Casablanca</strong>.
                </p>
                <p style="font-size: 13px; line-height: 1.6; color: #374151;">
                    Voici votre code de vérification pour valider votre adresse e-mail et activer votre compte candidat :
                </p>
                
                <div class="code-box">
                    <div class="code-value">' . htmlspecialchars($code) . '</div>
                </div>

                <p style="font-size: 12px; color: #868889; margin-bottom: 0;">
                    Ce code est valable pendant <strong>15 minutes</strong>. Si vous n\'êtes pas à l\'origine de cette demande, vous pouvez ignorer cet e-mail.
                </p>
            </div>
            <div class="footer">
                École Supérieure de Technologie de Casablanca (ESTC) &bull; Université Hassan II<br />
                Route d\'El Jadida, Km 7, B.P. 8012 Oasis, Casablanca &bull; contact@est-uh2c.ac.ma
            </div>
        </div>
    </body>
    </html>
    ';
}

$mail = new PHPMailer(true);

try {
    // Server settings
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'yhykk8899@gmail.com';
    $mail->Password   = 'qaxkzgcvanbqirvv';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;
    $mail->CharSet    = 'UTF-8';

    // Disable SSL verification for local XAMPP environments
    $mail->SMTPOptions = [
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ];

    // SENDER
    $mail->setFrom('yhykk8899@gmail.com', 'EST Casablanca - SMARTRECRUIT ATS');

    // RECIPIENTS (handles string, comma-separated, or array)
    if (is_array($toInput)) {
        foreach ($toInput as $recip) {
            $r = trim($recip);
            if (!empty($r)) $mail->addAddress($r);
        }
    } elseif (strpos($toInput, ',') !== false) {
        $parts = explode(',', $toInput);
        foreach ($parts as $p) {
            $r = trim($p);
            if (!empty($r)) $mail->addAddress($r);
        }
    } else {
        $mail->addAddress(trim($toInput), $name);
    }

    // EMBED ESTC LOGO AS CID (in memory to avoid Windows ACL is_readable issues)
    $logoCandidates = [
        __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'ESTC_transparent.png',
        __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'client' . DIRECTORY_SEPARATOR . 'public' . DIRECTORY_SEPARATOR . 'logo-estc.png',
        __DIR__ . DIRECTORY_SEPARATOR . '..' . DIRECTORY_SEPARATOR . 'ESTC.png',
    ];
    foreach ($logoCandidates as $candidate) {
        if (file_exists($candidate)) {
            $bytes = @file_get_contents($candidate);
            if (!empty($bytes)) {
                $mail->addStringEmbeddedImage($bytes, 'estc_logo', 'ESTC_transparent.png', 'base64', 'image/png');
                break;
            }
        }
    }

    // ATTACHMENT (CV PDF if available)
    if (!empty($attachmentPath) && file_exists($attachmentPath)) {
        $pdfBytes = @file_get_contents($attachmentPath);
        if (!empty($pdfBytes)) {
            $mail->addStringAttachment($pdfBytes, $attachmentName, 'base64', 'application/pdf');
        }
    }

    // Content
    $mail->isHTML(true);
    $mail->Subject = $subject;
    $mail->Body    = $customBody;
    $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<p>', '</p>'], ["\n", "\n", "\n", "\n"], $customBody));

    $mail->send();

    echo json_encode([
        'success' => true,
        'message' => 'E-mail envoyé avec succès via PHPMailer.',
        'recipient' => $toInput,
        'subject' => $subject
    ]);
    exit(0);

} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Erreur PHPMailer: ' . $mail->ErrorInfo,
        'recipient' => $toInput
    ]);
    exit(1);
}
