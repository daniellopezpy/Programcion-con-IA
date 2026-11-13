<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GuardarPresupuestoPagoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $formatoFecha = ['date_format:Y-m-d', 'after_or_equal:2000-01-01', 'before_or_equal:2100-12-31'];

        return [
            'limite' => ['bail', 'required', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'],
            'fecha_inicio' => ['bail', 'sometimes', 'required', ...$formatoFecha],
            'fecha_pago' => ['bail', 'required', ...$formatoFecha],
        ];
    }

    public function messages(): array
    {
        return [
            'limite.required' => 'Indica el límite de gasto.',
            'limite.numeric' => 'El límite debe ser un número.',
            'limite.decimal' => 'Usa como máximo dos decimales.',
            'limite.gt' => 'El límite debe ser mayor que cero.',
            'limite.max' => 'El límite es demasiado alto.',
            'fecha_inicio.required' => 'Indica la fecha de inicio.',
            'fecha_pago.required' => 'Indica la fecha de cobro.',
            '*.date_format' => 'Elige una fecha válida.',
            '*.after_or_equal' => 'La fecha debe ser a partir del 1 de enero de 2000.',
            '*.before_or_equal' => 'La fecha debe ser como máximo el 31 de diciembre de 2100.',
        ];
    }
}
