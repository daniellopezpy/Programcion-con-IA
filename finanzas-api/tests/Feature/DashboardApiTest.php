<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_resumen_mensual_calcula_mes_y_acumulado_sin_incluir_meses_posteriores(): void
    {
        [$ana, $luis, $vivienda, $ocio, $empleo] = $this->crearContexto();

        $this->crearIngreso($ana, $empleo, '2026-01-10', '1000.10');
        $this->crearIngreso($ana, $empleo, '2026-05-10', '2000.20');
        $this->crearIngreso($ana, $empleo, '2026-07-10', '9000.00');
        $this->crearEgreso($ana, $vivienda, '2026-01-12', '150.05');
        $this->crearEgreso($ana, $vivienda, '2026-05-12', '500.15');
        $this->crearEgreso($ana, $ocio, '2026-05-20', '300.00');
        $this->crearIngreso($luis, $empleo, '2026-05-10', '99000.00');
        $this->crearEgreso($luis, $vivienda, '2026-05-12', '88000.00');

        Sanctum::actingAs($ana);
        DB::flushQueryLog();
        DB::enableQueryLog();

        $this->getJson('/api/dashboard/resumen?anio=2026&mes=5')
            ->assertOk()
            ->assertExactJson([
                'ingresos_mes' => '2000.20',
                'egresos_mes' => '800.15',
                'balance_mes' => '1200.05',
                'ingresos_acumulados' => '3000.30',
                'egresos_acumulados' => '950.20',
                'balance_acumulado' => '2050.10',
                'porcentaje_gastado' => '40.00',
            ]);

        $this->assertCount(1, DB::getQueryLog());
    }

    public function test_resumen_mensual_devuelve_ceros_si_no_hay_datos_y_evitar_division_por_cero(): void
    {
        $ana = User::factory()->create();
        Sanctum::actingAs($ana);

        $this->getJson('/api/dashboard/resumen?anio=2026&mes=6')
            ->assertOk()
            ->assertExactJson([
                'ingresos_mes' => '0.00',
                'egresos_mes' => '0.00',
                'balance_mes' => '0.00',
                'ingresos_acumulados' => '0.00',
                'egresos_acumulados' => '0.00',
                'balance_acumulado' => '0.00',
                'porcentaje_gastado' => '0.00',
            ]);
    }

    public function test_egresos_por_categoria_agrupa_ordena_y_filtra_por_usuario_y_mes(): void
    {
        [$ana, $luis, $vivienda, $ocio] = $this->crearContexto();

        $this->crearEgreso($ana, $vivienda, '2026-05-05', '125.50');
        $this->crearEgreso($ana, $vivienda, '2026-05-08', '74.50');
        $this->crearEgreso($ana, $ocio, '2026-05-09', '350.00');
        $this->crearEgreso($ana, $ocio, '2026-07-09', '5000.00');
        $this->crearEgreso($luis, $vivienda, '2026-05-09', '9000.00');

        Sanctum::actingAs($ana);

        $this->getJson('/api/dashboard/egresos-por-categoria?anio=2026&mes=5')
            ->assertOk()
            ->assertExactJson([
                [
                    'categoria_id' => $ocio->id,
                    'nombre' => 'Ocio',
                    'total' => '350.00',
                ],
                [
                    'categoria_id' => $vivienda->id,
                    'nombre' => 'Vivienda',
                    'total' => '200.00',
                ],
            ]);
    }

    public function test_resumen_anual_siempre_devuelve_los_doce_meses(): void
    {
        [$ana, , $vivienda, , $empleo] = $this->crearContexto();
        $this->crearIngreso($ana, $empleo, '2026-01-10', '1000.00');
        $this->crearEgreso($ana, $vivienda, '2026-01-11', '250.00');
        $this->crearEgreso($ana, $vivienda, '2026-07-11', '75.25');

        Sanctum::actingAs($ana);

        $respuesta = $this->getJson('/api/dashboard/resumen-anual?anio=2026')
            ->assertOk()
            ->assertJsonCount(12);

        $respuesta->assertJsonPath('0', [
            'mes' => 1,
            'ingresos' => '1000.00',
            'egresos' => '250.00',
            'balance' => '750.00',
        ]);
        $respuesta->assertJsonPath('5', [
            'mes' => 6,
            'ingresos' => '0.00',
            'egresos' => '0.00',
            'balance' => '0.00',
        ]);
        $respuesta->assertJsonPath('6', [
            'mes' => 7,
            'ingresos' => '0.00',
            'egresos' => '75.25',
            'balance' => '-75.25',
        ]);
    }

    public function test_dashboard_valida_parametros_y_exige_autenticacion(): void
    {
        $this->getJson('/api/dashboard/resumen?anio=2026&mes=5')->assertUnauthorized();

        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/dashboard/resumen?anio=hola&mes=13')
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['anio', 'mes']);
        $this->getJson('/api/dashboard/resumen-anual')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('anio');
    }

    /** @return array{User, User, Categoria, Categoria, Categoria} */
    private function crearContexto(): array
    {
        return [
            User::factory()->create(),
            User::factory()->create(),
            Categoria::create(['nombre' => 'Vivienda', 'tipo' => 'egreso']),
            Categoria::create(['nombre' => 'Ocio', 'tipo' => 'egreso']),
            Categoria::create(['nombre' => 'Empleo', 'tipo' => 'ingreso']),
        ];
    }

    private function crearIngreso(User $user, Categoria $categoria, string $fecha, string $monto): void
    {
        $user->ingresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => $fecha,
            'fuente' => 'Dato de prueba',
            'monto' => $monto,
        ]);
    }

    private function crearEgreso(User $user, Categoria $categoria, string $fecha, string $monto): void
    {
        $user->egresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => $fecha,
            'descripcion' => 'Dato de prueba',
            'monto' => $monto,
        ]);
    }
}
