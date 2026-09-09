import { AuthScreenLayout } from '@/components/ui/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { FotoCaptura } from '@/components/fotoCaptura';
import { Input } from '@/components/ui/Input';
import { SelectPicker } from '@/components/ui/SelectPicker';
import { mesasServicio } from '@/lib/mesasServicio';
import type { MesaTipo } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const TIPOS: Record<string, MesaTipo> = {
  'VIP': 'vip',
  'Estándar': 'estandar',
  'Movilidad reducida': 'movilidad_reducida',
};

export default function NuevaMesaScreen() {
  const [numero, setNumero] = useState('');
  const [comensales, setComensales] = useState('');
  const [tipoLabel, setTipoLabel] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [qrGenerado, setQrGenerado] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const validar = async () => {
    const nuevosErrores: Record<string, string> = {};
    const numeroTrim = numero.trim();

    if (!numeroTrim) nuevosErrores.numero = 'El número de mesa es obligatorio';
    else if (!/^\d+$/.test(numeroTrim)) nuevosErrores.numero = 'Debe ser un entero positivo';
    else if (parseInt(numeroTrim, 10) <= 0) nuevosErrores.numero = 'Debe ser mayor a 0';

    const comensalesTrim = comensales.trim();
    if (!comensalesTrim) nuevosErrores.comensales = 'La cantidad de comensales es obligatoria';
    else if (!/^\d+$/.test(comensalesTrim)) nuevosErrores.comensales = 'Debe ser un número entero';
    else {
      const n = parseInt(comensalesTrim, 10);
      if (n <= 0) nuevosErrores.comensales = 'Debe ser mayor a 0';
      else if (n > 20) nuevosErrores.comensales = 'Máximo 20 comensales por mesa';
    }

    if (!tipoLabel) nuevosErrores.tipo = 'Debe seleccionar un tipo de mesa';
    if (!fotoUri) nuevosErrores.foto = 'Debe tomar una foto de la mesa';

    if (!nuevosErrores.numero) {
      const existe = await mesasServicio.existeNumero(parseInt(numeroTrim, 10));
      if (existe) nuevosErrores.numero = 'Ya existe una mesa con ese número';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const guardar = async () => {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      const esValido = await validar();
      if (!esValido) return;

      const mesa = await mesasServicio.crear({
        numero: parseInt(numero, 10),
        comensales: parseInt(comensales, 10),
        tipo: TIPOS[tipoLabel],
        foto_url: fotoUri!,
      });

      setQrGenerado(mesa.qr_data);
    } catch (e: any) {
      setErrorGeneral(e.message ?? 'No se pudo guardar la mesa');
    } finally {
      setEnviando(false);
    }
  };

  const nuevaMesa = () => {
    setNumero('');
    setComensales('');
    setTipoLabel('');
    setFotoUri(null);
    setErrores({});
    setQrGenerado(null);
  };

  if (qrGenerado) {
    return (
      <AuthScreenLayout backHref="/(app)/manager-home">
        <View className="items-center justify-center gap-6 py-4">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-100 border border-emerald-200">
            <Ionicons name="checkmark-done" size={32} color="#059669" />
          </View>

          <View className="items-center gap-1">
            <Text className="text-center text-2xl font-bold text-neutral-900">
              ¡Mesa creada con éxito!
            </Text>
            <Text className="text-center text-xs text-neutral-500">
              Escanea o descarga el código QR asociado a esta mesa
            </Text>
          </View>

          <View className="rounded-2xl bg-white p-6 border border-neutral-400/10 shadow-md">
            <QRCode value={qrGenerado} size={200} />
          </View>

          <View className="w-full pt-2">
            <Button title="Agregar otra mesa" onPress={nuevaMesa} />
          </View>
        </View>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout backHref="/(app)/manager-home">
      <View className="gap-4">
        {/* Encabezado */}
        <View className="mb-1 border-b border-neutral-400/20 pb-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Gestión de salón
          </Text>
          <Text className="text-xl font-bold text-neutral-900">
            Agregar nueva mesa
          </Text>
        </View>

        <FormError message={errorGeneral} onDismiss={() => setErrorGeneral(null)} />

        {/* Campo Número de Mesa */}
        <View>
          <Input
            label="Número de mesa"
            keyboardType="number-pad"
            value={numero}
            onChangeText={setNumero}
            placeholder="Ej: 12 (Solo números)"
            error={errores.numero}
          />
        </View>

        {/* Campo Comensales */}
        <View>
          <Input
            label="Cantidad de comensales"
            keyboardType="number-pad"
            value={comensales}
            onChangeText={setComensales}
            placeholder="Ej: 4 (Máximo 20 por mesa)"
            error={errores.comensales}
          />
        </View>

        {/* Tipo de Mesa */}
        <SelectPicker
          label="Tipo de mesa"
          value={tipoLabel}
          options={Object.keys(TIPOS)}
          placeholder="Selecciona la categoría (VIP, Standard...)"
          error={errores.tipo}
          onChange={setTipoLabel}
        />

        {/* Estado Inicial por Defecto */}
        <View className="gap-1.5">
          <Text className="text-xs font-medium text-neutral-700">Estado de disponibilidad inicial</Text>
          <View className="flex-row items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3">
            <Ionicons name="checkmark-circle" size={18} color="#059669" />
            <View>
              <Text className="text-xs font-bold text-emerald-800">Vacía (Por defecto)</Text>
              <Text className="text-[10px] text-emerald-600">Estará disponible inmediatamente para asignación</Text>
            </View>
          </View>
        </View>

        {/* Captura de Foto */}
        <FotoCaptura
          label="Foto de la mesa"
          photoUri={fotoUri}
          onPhotoChange={setFotoUri}
          error={errores.foto}
        />

        {/* Acciones */}
        <View className="mt-2 pt-2 border-t border-neutral-400/10">
          <Button
            title={enviando ? 'Guardando mesa...' : 'Guardar y Generar QR'}
            onPress={guardar}
            disabled={enviando}
          />
        </View>
      </View>
    </AuthScreenLayout>
  );
}