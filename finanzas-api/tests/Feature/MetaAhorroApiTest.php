<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MetaAhorroApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_puede_guardar_y_consultar_meta_con_progreso_de_ingresos_acumulados(): void
    {
        $usuario = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Trabajo', 'tipo' => 'ingreso']);
        $usuario->ingresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-03-10',
            'fuente' => 'Salario',
            'monto' => '800.00',
        ]);
        $usuario->ingresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-10-10',
            'fuente' => 'Proyecto',
            'monto' => '400.00',
        ]);

        Sanctum::actingAs($usuario);

        $this->putJson('/api/dashboard/meta-ahorro', [
            'anio' => 2026,
            'mes' => 10,
            'monto_objetivo' => '1000.00',
        ])
            ->assertOk()
            ->assertJsonPath('meta.monto_objetivo', '1000.00')
            ->assertJsonPath('ingresos_acumulados', '1200.00')
            ->assertJsonPath('porcentaje_progreso', '100.00')
            ->assertJsonPath('faltante', '0.00');

        $this->getJson('/api/dashboard/meta-ahorro?anio=2026&mes=10')
            ->assertOk()
            ->assertJsonPath('meta.anio', 2026)
            ->assertJsonPath('meta.mes', 10)
            ->assertJsonPath('meta.monto_objetivo', '1000.00');
    }

    public function test_meta_es_independiente_por_usuario_y_periodo(): void
    {
        $ana = User::factory()->create();
        $luis = User::factory()->create();

        Sanctum::actingAs($ana);
        $this->putJson('/api/dashboard/meta-ahorro', [
            'anio' => 2026,
            'mes' => 10,
            'monto_objetivo' => '500.00',
        ])->assertOk();

        $this->getJson('/api/dashboard/meta-ahorro?anio=2026&mes=11')
            ->assertOk()
            ->assertJsonPath('meta', null);

        Sanctum::actingAs($luis);
        $this->getJson('/api/dashboard/meta-ahorro?anio=2026&mes=10')
            ->assertOk()
            ->assertJsonPath('meta', null);
    }

    public function test_meta_valida_periodo_y_monto(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->putJson('/api/dashboard/meta-ahorro', [
            'anio' => 1999,
            'mes' => 13,
            'monto_objetivo' => '0',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['anio', 'mes', 'monto_objetivo']);
    }

    public function test_usuario_puede_eliminar_meta_del_periodo(): void
    {
        $usuario = User::factory()->create();
        Sanctum::actingAs($usuario);

        $this->putJson('/api/dashboard/meta-ahorro', [
            'anio' => 2026,
            'mes' => 10,
            'monto_objetivo' => '500.00',
        ])->assertOk();

        $this->deleteJson('/api/dashboard/meta-ahorro?anio=2026&mes=10')
            ->assertNoContent();

        $this->getJson('/api/dashboard/meta-ahorro?anio=2026&mes=10')
            ->assertOk()
            ->assertJsonPath('meta', null);
    }
}
