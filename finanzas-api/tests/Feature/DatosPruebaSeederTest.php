<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\CategoriaSeeder;
use Database\Seeders\DatosPruebaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatosPruebaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_crea_dos_usuarios_con_datos_y_deja_junio_vacio(): void
    {
        $this->seed(CategoriaSeeder::class);
        $this->seed(DatosPruebaSeeder::class);
        $this->seed(DatosPruebaSeeder::class);

        $this->assertDatabaseCount('users', 2);

        foreach (User::query()->get() as $user) {
            $this->assertCount(6, $user->ingresos);
            $this->assertGreaterThanOrEqual(36, $user->egresos()->count());
            $this->assertLessThanOrEqual(72, $user->egresos()->count());
            $this->assertSame(0, $user->ingresos()->delMes(2026, 6)->count());
            $this->assertSame(0, $user->egresos()->delMes(2026, 6)->count());
        }
    }
}
