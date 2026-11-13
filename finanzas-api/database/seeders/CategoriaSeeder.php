<?php

namespace Database\Seeders;

use App\Models\Categoria;
use Illuminate\Database\Seeder;

class CategoriaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categoriasIngreso = [
            'Empleo',
            'Freelance / Proyecto',
            'Negocio Propio',
            'Inversión / Dividendos',
            'Bono / Extra',
            'Otro Ingreso',
        ];

        foreach ($categoriasIngreso as $nombre) {
            Categoria::firstOrCreate([
                'user_id' => null,
                'nombre' => $nombre,
                'tipo' => 'ingreso',
            ]);
        }

        $categoriasEgreso = [
            'Vivienda' => ['Alquiler', 'Agua', 'Luz', 'Internet'],
            'Educación' => ['Universidad', 'Cursos', 'Libros'],
            'Alimentación' => ['Supermercado', 'Restaurante', 'Almuerzo'],
            'Transporte' => ['Gasolina', 'Bus', 'Taxi / Uber', 'Parqueo'],
            'Salud' => ['Consulta', 'Medicamentos', 'Laboratorio'],
            'Ocio / Entretenimiento' => ['Suscripciones', 'Cine', 'Salidas'],
            'Deporte' => ['Gimnasio', 'Equipo deportivo'],
            'Imprevistos' => ['Emergencias', 'Reparaciones'],
            'Otro Egreso' => [],
        ];

        foreach ($categoriasEgreso as $nombre => $subcategorias) {
            $categoria = Categoria::firstOrCreate([
                'user_id' => null,
                'nombre' => $nombre,
                'tipo' => 'egreso',
            ]);

            foreach ($subcategorias as $nombreSubcategoria) {
                $categoria->subcategorias()->firstOrCreate([
                    'nombre' => $nombreSubcategoria,
                ]);
            }
        }
    }
}
