<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class IngresoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_crud_de_ingresos_filtra_por_usuario(): void
    {
        $ana = User::factory()->create();
        $luis = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Empleo', 'tipo' => 'ingreso']);
        $ingresoLuis = $luis->ingresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-01',
            'fuente' => 'Trabajo de Luis',
            'monto' => '2000.00',
        ]);

        Sanctum::actingAs($ana);

        $creado = $this->postJson('/api/ingresos', [
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-02',
            'fuente' => 'Trabajo de Ana',
            'monto' => '2500.00',
        ])->assertCreated();

        $this->getJson('/api/ingresos?anio=2026&mes=5')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.fuente', 'Trabajo de Ana');
        $this->getJson("/api/ingresos/{$ingresoLuis->id}")->assertNotFound();
        $this->deleteJson('/api/ingresos/'.$creado->json('id'))->assertNoContent();
    }

    public function test_no_acepta_una_categoria_de_egreso_para_un_ingreso(): void
    {
        $ana = User::factory()->create();
        $categoriaEgreso = Categoria::create(['nombre' => 'Vivienda', 'tipo' => 'egreso']);
        Sanctum::actingAs($ana);

        $this->postJson('/api/ingresos', [
            'categoria_id' => $categoriaEgreso->id,
            'fecha' => '2026-05-02',
            'fuente' => 'Trabajo',
            'monto' => '2500.00',
        ])->assertUnprocessable()->assertJsonValidationErrors('categoria_id');
    }
}
