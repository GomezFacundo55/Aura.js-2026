import { AuthScreenLayout } from '@/components/ui/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { FotoCaptura } from '@/components/fotoCaptura';
import { Input } from '@/components/ui/Input';
import { SelectPicker } from '@/components/ui/SelectPicker';
import { mesasServicio } from '@/lib/mesasServicio';
import type { MesaTipo } from '@/types/database';
import { useState } from 'react';
import { Text, View } from 'react-native';
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
        <View className="items-center gap-6">
          <Text className="text-center text-2xl font-bold text-neutral-900">
            Mesa creada correctamente
          </Text>
          <View className="rounded-2xl bg-surface-light p-6">
            <QRCode value={qrGenerado} size={220} />
          </View>
          <Button title="Agregar otra mesa" onPress={nuevaMesa} />
        </View>
      </AuthScreenLayout>
    );
  }

  return (
    <AuthScreenLayout backHref="/(app)/manager-home">
      <View className="gap-3">
        <Text className="text-center text-lg font-bold text-neutral-900">
          Agregar nueva mesa
        </Text>

        <FormError message={errorGeneral} onDismiss={() => setErrorGeneral(null)} />

        <Input
          label="Número de mesa"
          keyboardType="number-pad"
          value={numero}
          onChangeText={setNumero}
          placeholder="Ej: 12"
          error={errores.numero}
        />

        <Input
          label="Cantidad de comensales"
          keyboardType="number-pad"
          value={comensales}
          onChangeText={setComensales}
          placeholder="Ej: 4"
          error={errores.comensales}
        />

        <SelectPicker
          label="Tipo de mesa"
          value={tipoLabel}
          options={Object.keys(TIPOS)}
          placeholder="Seleccioná el tipo de mesa"
          error={errores.tipo}
          onChange={setTipoLabel}
        />

        <View className="gap-1.5">
          <Text className="text-base font-medium text-neutral-700">Disponibilidad</Text>
          <View className="rounded-xl bg-success/10 px-3 py-2.5">
            <Text className="text-base font-semibold text-success">Vacía (por defecto)</Text>
          </View>
        </View>

        <FotoCaptura
          label="Foto de la mesa"
          photoUri={fotoUri}
          onPhotoChange={setFotoUri}
          error={errores.foto}
        />

        <Button
          title={enviando ? 'Guardando...' : 'Guardar mesa'}
          onPress={guardar}
          disabled={enviando}
        />
      </View>
    </AuthScreenLayout>
  );
}