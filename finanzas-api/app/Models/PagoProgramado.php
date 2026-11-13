<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['clave', 'configuracion', 'fechas_pagadas'])]
class PagoProgramado extends Model
{
    use SoftDeletes;

    protected $table = 'pagos_programados';

    protected function casts(): array
    {
        return ['configuracion' => 'array', 'fechas_pagadas' => 'array'];
    }

    public function datos(): array
    {
        return [...$this->configuracion, 'id' => $this->clave, 'paidDates' => $this->fechas_pagadas];
    }

    public function cambiarFechaPagada(string $fecha, bool $pagada): void
    {
        $fechas = array_values(array_diff($this->fechas_pagadas, [$fecha]));
        if ($pagada) {
            $fechas[] = $fecha;
        }
        sort($fechas);
        $this->update(['fechas_pagadas' => $fechas]);
    }
}
