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
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fuente', 'Trabajo de Ana');
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

    public function test_index_pagina_y_filtra_por_rango_sin_mezclar_usuarios(): void
    {
        $ana = User::factory()->create();
        $luis = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Empleo', 'tipo' => 'ingreso']);

        foreach (['2026-05-01', '2026-05-02', '2026-05-03'] as $fecha) {
            $ana->ingresos()->create([
                'categoria_id' => $categoria->id,
                'fecha' => $fecha,
                'fuente' => 'Trabajo de Ana',
                'monto' => '100.00',
            ]);
        }
        $luis->ingresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-02',
            'fuente' => 'Trabajo de Luis',
            'monto' => '999.00',
        ]);

        Sanctum::actingAs($ana);

        $this->getJson('/api/ingresos?desde=2026-05-01&hasta=2026-05-03&per_page=1&page=2')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.fecha', '2026-05-02T00:00:00.000000Z')
            ->assertJsonPath('meta.current_page', 2)
            ->assertJsonPath('meta.last_page', 3)
            ->assertJsonPath('meta.total', 3);
    }

    public function test_index_rechaza_rango_incompleto_o_invertido(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $this->getJson('/api/ingresos?desde=2026-05-03')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('hasta');
        $this->getJson('/api/ingresos?desde=2026-05-04&hasta=2026-05-03')
            ->assertUnprocessable()
            ->assertJsonValidationErrors('hasta');
    }
}
