<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Symfony\Component\Mailer\Exception\TransportExceptionInterface;

class RecuperarContrasenaController extends Controller
{
    public function solicitar(Request $request): JsonResponse
    {
        $datos = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $mailer = config('mail.default');
        if ($mailer === 'log' || ($mailer === 'brevo' && blank(config('mail.mailers.brevo.key')))) {
            return response()->json(['message' => 'El envío de correo aún no está configurado en Saldo.'], 503);
        }
        try {
            Password::sendResetLink($datos);
        } catch (TransportExceptionInterface $error) {
            report($error);
        }

        return response()->json(['message' => 'Si hay una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña.']);
    }

    public function restablecer(Request $request): JsonResponse
    {
        $datos = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'token' => ['required', 'string', 'max:255'],
            'password' => ['required', 'confirmed', 'max:72', PasswordRule::min(8)],
        ]);

        $estado = DB::transaction(function () use ($datos): string {
            User::query()->where('email', $datos['email'])->lockForUpdate()->first();

            return Password::reset($datos, function (User $usuario, string $password): void {
                $usuario->forceFill(['password' => $password, 'remember_token' => Str::random(60)])->save();
                $usuario->tokens()->delete();
                event(new PasswordReset($usuario));
            });
        });

        return $estado === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Contraseña actualizada.'])
            : response()->json(['message' => 'El enlace ya no es válido. Solicita uno nuevo.'], 422);
    }
}
