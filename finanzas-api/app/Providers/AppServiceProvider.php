<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::toMailUsing(function (User $usuario, string $token): MailMessage {
            $url = rtrim(config('app.frontend_url'), '/').'/restablecer-contrasena#'.http_build_query([
                'token' => $token,
                'email' => $usuario->getEmailForPasswordReset(),
            ]);

            return (new MailMessage)
                ->subject('Restablece tu contraseña de Saldo')
                ->line('Recibimos una solicitud para restablecer tu contraseña.')
                ->action('Elegir una contraseña nueva', $url)
                ->line('El enlace caduca en '.config('auth.passwords.users.expire').' minutos.')
                ->line('Si no hiciste esta solicitud, puedes ignorar el mensaje.');
        });
    }
}
