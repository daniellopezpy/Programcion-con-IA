<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['identificador', 'clave', 'persona', 'monto', 'fecha_vencimiento', 'nota', 'fecha_recibido', 'ingreso_id'])]
class Cobro extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'fecha_vencimiento' => 'immutable_date',
            'fecha_recibido' => 'immutable_date',
            'ingreso_id' => 'integer',
        ];
    }

    public function paraApi(): array
    {
        return [
            'id' => $this->identificador,
            'person' => $this->persona,
            'amount' => $this->monto,
            'dueDate' => $this->fecha_vencimiento?->toDateString() ?? '',
            'note' => $this->nota ?? '',
            'collectedDate' => $this->fecha_recibido?->toDateString() ?? '',
            'incomeId' => $this->ingreso_id,
        ];
    }
}
