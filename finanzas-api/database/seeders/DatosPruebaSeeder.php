<?php

namespace Database\Seeders;

use App\Models\Egreso;
use App\Models\Ingreso;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;

class DatosPruebaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $usuarios = [
            ['name' => 'Ana Prueba', 'email' => 'ana@example.com'],
            ['name' => 'Luis Prueba', 'email' => 'luis@example.com'],
        ];

        foreach ($usuarios as $datosUsuario) {
            $user = User::query()->updateOrCreate(
                ['email' => $datosUsuario['email']],
                [...$datosUsuario, 'password' => 'Finanzas2026!'],
            );

            $user->ingresos()->delete();
            $user->egresos()->delete();

            foreach ([1, 2, 3, 4, 5, 7] as $mes) {
                $inicioMes = CarbonImmutable::create(2026, $mes, 1);

                Ingreso::factory()->for($user)->create([
                    'fecha' => $inicioMes->addDays(fake()->numberBetween(0, 4)),
                ]);

                Egreso::factory()
                    ->count(fake()->numberBetween(6, 12))
                    ->for($user)
                    ->create([
                        'fecha' => fn () => $inicioMes->addDays(fake()->numberBetween(0, $inicioMes->daysInMonth - 1)),
                    ]);
            }
        }
    }
}
