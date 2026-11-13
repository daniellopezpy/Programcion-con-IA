<?php

namespace App\Mail;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Symfony\Component\Mailer\Exception\TransportException;
use Symfony\Component\Mailer\SentMessage;
use Symfony\Component\Mailer\Transport\AbstractTransport;
use Symfony\Component\Mime\Address;
use Symfony\Component\Mime\Email;

class BrevoTransport extends AbstractTransport
{
    public function __construct(private readonly string $apiKey)
    {
        parent::__construct();
    }

    public function __toString(): string
    {
        return 'brevo';
    }

    protected function doSend(SentMessage $message): void
    {
        if (blank($this->apiKey)) {
            throw new TransportException('Falta configurar la clave de Brevo.');
        }

        $email = $message->getOriginalMessage();
        if (! $email instanceof Email || ! is_string($email->getTextBody()) || $email->getAttachments() !== []) {
            throw new TransportException('El remitente de Saldo requiere un correo de texto sin adjuntos.');
        }

        $envelope = $message->getEnvelope();

        try {
            $response = Http::acceptJson()
                ->withHeader('api-key', $this->apiKey)
                ->withoutRedirecting()
                ->connectTimeout(3)
                ->timeout(8)
                ->post('https://api.brevo.com/v3/smtp/email', [
                    'sender' => $this->address($envelope->getSender()),
                    'to' => array_map($this->address(...), $envelope->getRecipients()),
                    'subject' => $email->getSubject(),
                    'textContent' => $email->getTextBody(),
                ]);
        } catch (ConnectionException) {
            throw new TransportException('No se pudo conectar con Brevo.');
        }

        $id = $response->json('messageId');
        if ($response->status() !== 201 || ! is_string($id) || $id === '') {
            throw new TransportException('Brevo no aceptó el correo (HTTP '.$response->status().').');
        }

        $message->setMessageId($id);
    }

    /** @return array{email: string, name?: string} */
    private function address(Address $address): array
    {
        return array_filter(['email' => $address->getAddress(), 'name' => $address->getName()], fn (string $value) => $value !== '');
    }
}
