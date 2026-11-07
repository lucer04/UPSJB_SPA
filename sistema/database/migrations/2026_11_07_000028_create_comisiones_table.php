<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comisiones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('especialista_id')->constrained('especialistas');
            $table->foreignId('detalle_venta_id')->nullable()->unique()->constrained('detalles_venta')->nullOnDelete();
            $table->foreignId('regla_comision_id')->constrained('reglas_comision');
            $table->date('fecha');
            $table->decimal('monto', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comisiones');
    }
};
