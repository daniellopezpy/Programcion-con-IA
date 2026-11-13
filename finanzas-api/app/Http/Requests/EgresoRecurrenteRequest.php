<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EgresoRecurrenteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'pago' => $this->route('paymentId'),
            'vencimiento' => $this->route('dueDate'),
        ]);
    }

    public function rules(): array
    {
        $rules = [
            'pago' => ['bail', 'required', 'string', 'max:80', 'regex:/\A[a-zA-Z0-9-]+\z/'],
            'vencimiento' => ['bail', 'required', 'date_format:Y-m-d'],
        ];

        if ($this->isMethod('POST')) {
            $rules['descripcion'] = ['bail', 'required', 'string', 'max:150'];
            $rules['monto'] = ['bail', 'required', 'numeric', 'decimal:0,2', 'gt:0', 'max:9999999999.99'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'pago.*' => 'El identificador del pago recurrente no es válido.',
            'vencimiento.*' => 'Elige una fecha de vencimiento válida.',
            'descripcion.required' => 'Escribe una descripción para el gasto.',
            'descripcion.max' => 'La descripción no puede exceder 150 caracteres.',
            'monto.required' => 'Indica el monto del pago.',
            'monto.numeric' => 'El monto debe ser un número.',
            'monto.decimal' => 'Usa como máximo dos decimales.',
            'monto.gt' => 'El monto debe ser mayor que cero.',
            'monto.max' => 'El monto es demasiado alto.',
        ];
    }

    public function claveDelVencimiento(): string
    {
        $datos = $this->validated();

        return hash('sha256', $datos['pago'].':'.$datos['vencimiento']);
    }
}
