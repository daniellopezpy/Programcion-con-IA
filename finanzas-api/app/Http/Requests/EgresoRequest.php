<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EgresoRequest extends FormRequest
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
        $userId = $this->user()->getKey();

        return [
            'fecha' => ['required', 'date', 'before_or_equal:today'],
            'descripcion' => ['required', 'string', 'max:150'],
            'categoria_id' => [
                'required',
                'integer',
                Rule::exists('categorias', 'id')->where(
                    fn (Builder $query) => $query
                        ->where('tipo', 'egreso')
                        ->where(fn (Builder $query) => $query
                            ->whereNull('user_id')
                            ->orWhere('user_id', $userId)),
                ),
            ],
            'subcategoria_id' => [
                'nullable',
                'integer',
                Rule::exists('subcategorias', 'id')->where(
                    fn (Builder $query) => $query->where('categoria_id', $this->input('categoria_id')),
                ),
            ],
            'monto' => ['required', 'numeric', 'gt:0', 'decimal:0,2'],
            'notas' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'fecha.required' => 'La fecha es obligatoria.',
            'fecha.date' => 'La fecha debe tener un formato válido.',
            'fecha.before_or_equal' => 'La fecha no puede ser futura.',
            'descripcion.required' => 'La descripción es obligatoria.',
            'descripcion.string' => 'La descripción debe ser texto.',
            'descripcion.max' => 'La descripción no puede exceder 150 caracteres.',
            'categoria_id.required' => 'La categoría es obligatoria.',
            'categoria_id.exists' => 'La categoría no existe, no es de egreso o no está disponible para este usuario.',
            'subcategoria_id.exists' => 'La subcategoría no pertenece a la categoría seleccionada.',
            'monto.required' => 'El monto es obligatorio.',
            'monto.numeric' => 'El monto debe ser numérico.',
            'monto.gt' => 'El monto debe ser mayor que cero.',
            'monto.decimal' => 'El monto puede tener como máximo dos decimales.',
            'notas.string' => 'Las notas deben ser texto.',
        ];
    }
}
