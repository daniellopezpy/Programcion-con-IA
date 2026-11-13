<?php

namespace App\Support;

use App\Models\Categoria;
use App\Models\Ingreso;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class IngresosDeCobros
{
    public static function clave(string $identificador): string
    {
        return hash('sha256', $identificador);
    }

    public function registrar(User $usuario, string $clave, string $fuente, string $monto): Ingreso
    {
        return $usuario->ingresos()->firstOrCreate(
            ['cobro_clave' => $clave],
            function () use ($fuente, $monto): array {
                $categoriaId = Categoria::query()
                    ->whereNull('user_id')
                    ->where('tipo', 'ingreso')
                    ->where('nombre', 'Otro Ingreso')
                    ->value('id');

                if ($categoriaId === null) {
                    throw ValidationException::withMessages([
                        'categoria_id' => 'Falta la categoría Otro Ingreso. No se registró el cobro.',
                    ]);
                }

                return [
                    'categoria_id' => $categoriaId,
                    'fecha' => CarbonImmutable::today('America/Guatemala')->toDateString(),
                    'fuente' => $fuente,
                    'monto' => $monto,
                ];
            },
        );
    }
}
