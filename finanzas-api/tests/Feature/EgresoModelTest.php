<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Egreso;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EgresoModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_filtra_por_mes_y_conserva_la_precision_del_monto(): void
    {
        $user = User::factory()->create();
        $categoria = Categoria::create([
            'nombre' => 'Vivienda',
            'tipo' => 'egreso',
        ]);

        $egresoMayo = new Egreso([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-18',
            'descripcion' => 'Pago de internet',
            'monto' => '125.50',
        ]);
        $user->egresos()->save($egresoMayo);

        $egresoJunio = new Egreso([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-06-18',
            'descripcion' => 'Pago de agua',
            'monto' => '80.00',
        ]);
        $user->egresos()->save($egresoJunio);

        $resultados = Egreso::query()->delMes(2026, 5)->get();

        $this->assertCount(1, $resultados);
        $this->assertTrue($resultados->first()->is($egresoMayo));
        $this->assertSame('125.50', $resultados->first()->monto);
        $this->assertSame('2026-05-18', $resultados->first()->fecha->toDateString());
    }
}
