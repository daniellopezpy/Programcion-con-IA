<?php

namespace Tests\Feature;

use App\Models\Categoria;
use App\Models\Subcategoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class EgresoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_filtra_por_usuario_mes_y_carga_relaciones(): void
    {
        [$ana, $luis, $categoria, $subcategoria] = $this->crearContexto();
        $mayoAna = $ana->egresos()->create([
            'categoria_id' => $categoria->id,
            'subcategoria_id' => $subcategoria->id,
            'fecha' => '2026-05-10',
            'descripcion' => 'Internet',
            'monto' => '125.50',
        ]);
        $ana->egresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-07-10',
            'descripcion' => 'Agua',
            'monto' => '80.00',
        ]);
        $luis->egresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-11',
            'descripcion' => 'Gasto de Luis',
            'monto' => '90.00',
        ]);

        Sanctum::actingAs($ana);

        $this->getJson('/api/egresos?anio=2026&mes=5')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $mayoAna->id)
            ->assertJsonPath('0.categoria.nombre', 'Vivienda')
            ->assertJsonPath('0.subcategoria.nombre', 'Internet');
    }

    public function test_otro_usuario_recibe_404_al_consultar_modificar_o_borrar_un_egreso(): void
    {
        [$ana, $luis, $categoria] = $this->crearContexto();
        $egreso = $ana->egresos()->create([
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-10',
            'descripcion' => 'Dato privado',
            'monto' => '125.50',
        ]);

        Sanctum::actingAs($luis);

        $this->getJson("/api/egresos/{$egreso->id}")->assertNotFound();
        $this->patchJson("/api/egresos/{$egreso->id}", [
            'categoria_id' => $categoria->id,
            'fecha' => '2026-05-10',
            'descripcion' => 'Intento',
            'monto' => '100.00',
        ])->assertNotFound();
        $this->deleteJson("/api/egresos/{$egreso->id}")->assertNotFound();
    }

    public function test_rechaza_categoria_ajena_subcategoria_incorrecta_fecha_futura_y_tres_decimales(): void
    {
        [$ana, $luis] = $this->crearContexto();
        $categoriaAjena = $luis->categorias()->create([
            'nombre' => 'Privada de Luis',
            'tipo' => 'egreso',
        ]);
        $otraCategoria = Categoria::create(['nombre' => 'Transporte', 'tipo' => 'egreso']);
        $subcategoriaIncorrecta = Subcategoria::create([
            'categoria_id' => $otraCategoria->id,
            'nombre' => 'Bus',
        ]);

        Sanctum::actingAs($ana);

        $this->postJson('/api/egresos', [
            'categoria_id' => $categoriaAjena->id,
            'subcategoria_id' => $subcategoriaIncorrecta->id,
            'fecha' => now()->addDay()->toDateString(),
            'descripcion' => 'Prueba inválida',
            'monto' => '10.123',
        ])->assertUnprocessable()->assertJsonValidationErrors([
            'categoria_id',
            'subcategoria_id',
            'fecha',
            'monto',
        ]);
    }

    /** @return array{User, User, Categoria, Subcategoria} */
    private function crearContexto(): array
    {
        $ana = User::factory()->create();
        $luis = User::factory()->create();
        $categoria = Categoria::create(['nombre' => 'Vivienda', 'tipo' => 'egreso']);
        $subcategoria = Subcategoria::create([
            'categoria_id' => $categoria->id,
            'nombre' => 'Internet',
        ]);

        return [$ana, $luis, $categoria, $subcategoria];
    }
}
