<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class IndexIngresoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'anio' => [
                'nullable',
                'integer',
                'between:2000,2100',
                'required_with:mes',
            ],
            'mes' => [
                'nullable',
                'integer',
                'between:1,12',
                'required_with:anio',
            ],
            'desde' => [
                'nullable',
                'date_format:Y-m-d',
                'required_with:hasta',
            ],
            'hasta' => [
                'nullable',
                'date_format:Y-m-d',
                'required_with:desde',
                'after_or_equal:desde',
            ],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ];
    }

    public function messages(): array
    {
        return [
            'anio.required_with' => 'Debes enviar el año junto con el mes.',
            'anio.integer' => 'El año debe ser un número entero.',
            'anio.between' => 'El año debe estar entre 2000 y 2100.',
            'mes.required_with' => 'Debes enviar el mes junto con el año.',
            'mes.integer' => 'El mes debe ser un número entero.',
            'mes.between' => 'El mes debe estar entre 1 y 12.',
            'desde.required_with' => 'Debes enviar la fecha inicial junto con la fecha final.',
            'desde.date_format' => 'La fecha inicial debe tener el formato YYYY-MM-DD.',
            'hasta.required_with' => 'Debes enviar la fecha final junto con la fecha inicial.',
            'hasta.date_format' => 'La fecha final debe tener el formato YYYY-MM-DD.',
            'hasta.after_or_equal' => 'La fecha final debe ser igual o posterior a la fecha inicial.',
            'page.integer' => 'La página debe ser un número entero.',
            'page.min' => 'La página debe ser mayor que cero.',
            'per_page.integer' => 'El tamaño de página debe ser un número entero.',
            'per_page.between' => 'El tamaño de página debe estar entre 1 y 100.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $hasMonthlyPeriod = $this->filled('anio') || $this->filled('mes');
            $hasDateRange = $this->filled('desde') || $this->filled('hasta');

            if (! $hasMonthlyPeriod || ! $hasDateRange) {
                return;
            }

            foreach (['anio', 'mes', 'desde', 'hasta'] as $field) {
                if ($this->filled($field)) {
                    $validator->errors()->add($field, 'No combines el período mensual con un rango de fechas.');
                }
            }
        });
    }
}
