
import { FotoCaptura } from '@/components/fotoCaptura';
import { AuthScreenLayout } from '@/components/ui/AuthScreenLayout';
import { Button } from '@/components/ui/Button';
import { FormError } from '@/components/ui/FormError';
import { Input } from '@/components/ui/Input';
import { mesasServicio } from '@/lib/mesasServicio';
import type { MesaTipo } from '@/types/database';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  Text,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const TIPOS: Record<string, MesaTipo> = {
  VIP: 'vip',
  Estándar: 'estandar',
  'Movilidad reducida': 'movilidad_reducida',
};

const COMENSALES_1_10 = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const COMENSALES_11_20 = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const MESAS_RAPIDAS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

/* =========================================================
   BOTÓN COMENSALES
========================================================= */
function ComensalButton({
  value,
  selected,
  onPress,
}: {
  value: number;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const pressIn = () => {
    Animated.timing(scale, {
      toValue: 0.92,
      duration: 70,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: selected ? 1.04 : 1,
      useNativeDriver: true,
      speed: 25,
      bounciness: 5,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={pressIn}
      onPressOut={pressOut}
      className="flex-1"
    >
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
        className={`h-11 items-center justify-center rounded-xl border ${
          selected
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-neutral-200 bg-white'
        }`}
      >
        <Text
          className={`text-sm font-bold ${
            selected ? 'text-white' : 'text-neutral-800'
          }`}
        >
          {value}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

/* =========================================================
   BOTÓN TIPO
========================================================= */
function TipoButton({
  label,
  icon,
  selected,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1"
    >
      <View
        className={`h-[74px] items-center justify-center rounded-xl border ${
          selected
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-neutral-200 bg-white'
        }`}
      >
        <Ionicons
          name={icon}
          size={21}
          color={selected ? '#ffffff' : '#404040'}
        />

        <Text
          numberOfLines={2}
          className={`mt-1 text-center text-[11px] font-bold leading-4 ${
            selected
              ? 'text-white'
              : 'text-neutral-800'
          }`}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/* =========================================================
   PANTALLA
========================================================= */
export default function NuevaMesaScreen() {
  const [numero, setNumero] = useState('');
  const [comensales, setComensales] = useState('');
  const [tipoLabel, setTipoLabel] = useState('');
  const [fotoUri, setFotoUri] = useState<string | null>(null);

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  const [qrGenerado, setQrGenerado] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const [numeroDisponible, setNumeroDisponible] =
    useState<boolean | null>(null);

  const [verificandoNumero, setVerificandoNumero] =
    useState(false);

  const [mostrarComensalesExtra, setMostrarComensalesExtra] =
    useState(false);

  const extraAnim = useRef(new Animated.Value(0)).current;

  const [mostrarNumeroManual, setMostrarNumeroManual] = useState(false);

  /* =======================================================
     VERIFICAR NÚMERO AUTOMÁTICAMENTE
  ======================================================= */
  useEffect(() => {
    const numeroTrim = numero.trim();

    if (!numeroTrim) {
      setNumeroDisponible(null);
      setVerificandoNumero(false);
      return;
    }

    if (!/^\d+$/.test(numeroTrim)) {
      setNumeroDisponible(null);
      setVerificandoNumero(false);
      return;
    }

    const numeroActual = parseInt(numeroTrim, 10);

    if (numeroActual <= 0) {
      setNumeroDisponible(null);
      setVerificandoNumero(false);
      return;
    }

    setVerificandoNumero(true);

    const timer = setTimeout(async () => {
      try {
        const existe =
          await mesasServicio.existeNumero(numeroActual);

        if (existe) {
          setNumeroDisponible(false);

          setErrores((prev) => ({
            ...prev,
            numero: 'Ese número ya existe',
          }));
        } else {
          setNumeroDisponible(true);

          setErrores((prev) => {
            const copia = { ...prev };
            delete copia.numero;
            return copia;
          });
        }
      } catch {
        setNumeroDisponible(null);
      } finally {
        setVerificandoNumero(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [numero]);

  /* =======================================================
     NÚMERO
  ======================================================= */
  const cambiarNumero = (text: string) => {
    const soloNumeros = text.replace(/\D/g, '');

    if (soloNumeros.length > 4) {
      return;
    }

    setNumero(soloNumeros);
    setNumeroDisponible(null);

    setErrores((prev) => {
      const copia = { ...prev };
      delete copia.numero;
      return copia;
    });
  };

  const seleccionarNumeroMesa = (cantidad: number) => {
  setNumero(String(cantidad));
  setMostrarNumeroManual(false);

  setErrores((prev) => {
    const copia = { ...prev };
    delete copia.numero;
    return copia;
  });
};

  /* =======================================================
     COMENSALES
  ======================================================= */
  const seleccionarComensales = (cantidad: number) => {
    setComensales(String(cantidad));

    setErrores((prev) => {
      const copia = { ...prev };
      delete copia.comensales;
      return copia;
    });
  };

  const abrirComensalesExtra = () => {
    if (mostrarComensalesExtra) {
      return;
    }

    setMostrarComensalesExtra(true);

    Animated.timing(extraAnim, {
      toValue: 1,
      duration: 180,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  };

  /* =======================================================
     TIPO
  ======================================================= */
  const seleccionarTipo = (tipo: string) => {
    setTipoLabel(tipo);

    setErrores((prev) => {
      const copia = { ...prev };
      delete copia.tipo;
      return copia;
    });
  };

  /* =======================================================
     VALIDAR
  ======================================================= */
  const validar = async () => {
    const nuevosErrores: Record<string, string> = {};

    const numeroTrim = numero.trim();

    if (!numeroTrim) {
      nuevosErrores.numero = 'Ingresá el número';
    } else if (!/^\d+$/.test(numeroTrim)) {
      nuevosErrores.numero = 'Solo números';
    } else if (parseInt(numeroTrim, 10) <= 0) {
      nuevosErrores.numero = 'Número inválido';
    }

    const comensalesTrim = comensales.trim();

    if (!comensalesTrim) {
      nuevosErrores.comensales = 'Elegí una cantidad';
    } else {
      const n = parseInt(comensalesTrim, 10);

      if (n <= 0) {
        nuevosErrores.comensales = 'Cantidad inválida';
      } else if (n > 20) {
        nuevosErrores.comensales = 'Máximo 20';
      }
    }

    if (!tipoLabel) {
      nuevosErrores.tipo = 'Elegí un tipo';
    }

    if (!fotoUri) {
      nuevosErrores.foto = 'Tomá una foto';
    }

    if (!nuevosErrores.numero) {
      const existe =
        await mesasServicio.existeNumero(
          parseInt(numeroTrim, 10)
        );

      if (existe) {
        nuevosErrores.numero =
          'Ese número ya existe';

        setNumeroDisponible(false);
      } else {
        setNumeroDisponible(true);
      }
    }

    setErrores(nuevosErrores);

    return Object.keys(nuevosErrores).length === 0;
  };

  /* =======================================================
     GUARDAR
  ======================================================= */
  const guardar = async () => {
    if (enviando) {
      return;
    }

    setErrorGeneral(null);
    setEnviando(true);

    try {
      const esValido = await validar();

      if (!esValido) {
        return;
      }

      const mesa = await mesasServicio.crear({
        numero: parseInt(numero, 10),
        comensales: parseInt(comensales, 10),
        tipo: TIPOS[tipoLabel],
        foto_url: fotoUri!,
      });

      setQrGenerado(mesa.qr_data);
    } catch (e: any) {
      setErrorGeneral(
        e.message ?? 'No se pudo guardar la mesa'
      );
    } finally {
      setEnviando(false);
    }
  };

  /* =======================================================
     NUEVA MESA
  ======================================================= */
  const nuevaMesa = () => {
    setNumero('');
    setComensales('');
    setTipoLabel('');
    setFotoUri(null);

    setErrores({});
    setQrGenerado(null);
    setErrorGeneral(null);

    setNumeroDisponible(null);
    setVerificandoNumero(false);

    setMostrarComensalesExtra(false);
    extraAnim.setValue(0);
  };

  /* =======================================================
     QR
  ======================================================= */
  if (qrGenerado) {
    return (
      <AuthScreenLayout backHref="/(app)/manager-home">

        <View className="gap-4 py-3">

          <View className="items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
              <Ionicons
                name="checkmark-done"
                size={29}
                color="#059669"
              />
            </View>
          </View>

          <Text className="text-center text-xl font-bold text-neutral-900">
            Mesa creada
          </Text>

          <Text className="text-center text-sm text-neutral-700">
            QR generado correctamente.
          </Text>

          <View className="items-center">
            <View className="rounded-2xl bg-white p-5">
              <QRCode
                value={qrGenerado}
                size={200}
              />
            </View>
          </View>

          <Button
            title="Agregar otra mesa"
            onPress={nuevaMesa}
          />

        </View>

      </AuthScreenLayout>
    );
  }

  /* =======================================================
     FORMULARIO
  ======================================================= */
  return (
    <AuthScreenLayout backHref="/(app)/manager-home">

      <View className="gap-3">

        {/* ENCABEZADO */}
        <View className="px-1">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-neutral-800">
            Gestión de salón
          </Text>

          <View className="flex-row items-end justify-between">
            <Text className="text-xl font-bold text-neutral-950">
              Nueva mesa
            </Text>

            <Text className="text-xs font-semibold text-neutral-700">
              Completá y guardá
            </Text>
          </View>
        </View>

        <FormError
          message={errorGeneral}
          onDismiss={() => setErrorGeneral(null)}
        />
{/* =================================================
    NÚMERO DE MESA
================================================= */}
<View className="rounded-2xl bg-white px-3 py-3">

  <View className="mb-2 flex-row items-center justify-between">

    <View>
      <Text className="text-sm font-bold text-neutral-900">
        Mesa
      </Text>

      <Text className="text-xs text-neutral-600">
        Seleccioná el número
      </Text>
    </View>

    {numero !== '' && (
      <View className="rounded-full bg-emerald-100 px-3 py-1.5">
        <Text className="text-xs font-bold text-emerald-700">
          Mesa {numero}
        </Text>
      </View>
    )}

  </View>

  {/* =========================================
      BOTONES 1 - 10
  ========================================= */}
  <View className="gap-1.5">

    <View className="flex-row gap-1.5">
      {MESAS_RAPIDAS.slice(0, 5).map((mesa) => (
        <Pressable
          key={mesa}
          onPress={() => seleccionarNumeroMesa(mesa)}
          className="flex-1"
        >
          <View
            className={`h-11 items-center justify-center rounded-xl border ${
              numero === String(mesa) && !mostrarNumeroManual
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-neutral-200 bg-white'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                numero === String(mesa) && !mostrarNumeroManual
                  ? 'text-white'
                  : 'text-neutral-800'
              }`}
            >
              {mesa}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>

    <View className="flex-row gap-1.5">
      {MESAS_RAPIDAS.slice(5, 10).map((mesa) => (
        <Pressable
          key={mesa}
          onPress={() => seleccionarNumeroMesa(mesa)}
          className="flex-1"
        >
          <View
            className={`h-11 items-center justify-center rounded-xl border ${
              numero === String(mesa) && !mostrarNumeroManual
                ? 'border-emerald-500 bg-emerald-500'
                : 'border-neutral-200 bg-white'
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                numero === String(mesa) && !mostrarNumeroManual
                  ? 'text-white'
                  : 'text-neutral-800'
              }`}
            >
              {mesa}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>

  </View>

  {/* =========================================
      AGREGAR OTRA MESA
  ========================================= */}
  <Pressable
    onPress={() => {
      setMostrarNumeroManual(true);
      setNumero('');
      setNumeroDisponible(null);

      setErrores((prev) => {
        const copia = { ...prev };
        delete copia.numero;
        return copia;
      });
    }}
    className="mt-2"
  >
    <View
      className={`h-11 flex-row items-center justify-center rounded-xl border ${
        mostrarNumeroManual
          ? 'border-emerald-500 bg-emerald-50'
          : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <Ionicons
        name="add"
        size={18}
        color="#059669"
      />

      <Text className="ml-1 text-xs font-bold text-emerald-700">
        Otra mesa
      </Text>
    </View>
  </Pressable>

  {/* =========================================
      INPUT PARA MESAS MAYORES A 10
  ========================================= */}
  {mostrarNumeroManual && (
    <View className="mt-2">

      <Text className="mb-1.5 text-xs font-semibold text-neutral-700">
        Número de mesa
      </Text>

      <View className="flex-row items-center">

        <View className="flex-1">
          <Input
            label=""
            keyboardType="number-pad"
            value={numero}
            onChangeText={cambiarNumero}
            placeholder="Ej: 11, 12, 25..."
            error={errores.numero}
          />
        </View>

        <View className="ml-2 w-[82px] items-center">

          {verificandoNumero ? (
            <Text className="text-[11px] font-semibold text-neutral-600">
              Buscando...
            </Text>
          ) : numeroDisponible === true && numero ? (
            <View className="flex-row items-center">
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#059669"
              />

              <Text className="ml-1 text-[11px] font-bold text-emerald-700">
                Libre
              </Text>
            </View>
          ) : numeroDisponible === false ? (
            <View className="flex-row items-center">
              <Ionicons
                name="close-circle"
                size={16}
                color="#dc2626"
              />

              <Text className="ml-1 text-[11px] font-bold text-red-700">
                Existe
              </Text>
            </View>
          ) : null}

        </View>

      </View>

    </View>
  )}

</View>



        {/* =================================================
            COMENSALES
        ================================================= */}
        <View className="rounded-2xl bg-white px-3 py-3">

          <View className="mb-2 flex-row items-center justify-between">

            <View>
              <Text className="text-sm font-bold text-neutral-900">
                Comensales
              </Text>

              <Text className="text-xs text-neutral-600">
                Capacidad de la mesa
              </Text>
            </View>

            {comensales !== '' && (
              <View className="rounded-full bg-emerald-100 px-3 py-1.5">
                <Text className="text-xs font-bold text-emerald-700">
                  {comensales}
                </Text>
              </View>
            )}

          </View>

          {/* 1-5 */}
          <View className="flex-row gap-1.5">
            {COMENSALES_1_10.slice(0, 5).map(
              (cantidad) => (
                <ComensalButton
                  key={cantidad}
                  value={cantidad}
                  selected={
                    comensales === String(cantidad)
                  }
                  onPress={() =>
                    seleccionarComensales(cantidad)
                  }
                />
              )
            )}
          </View>

          {/* 6-10 + */}
          <View className="mt-1.5 flex-row gap-1.5">

            {COMENSALES_1_10.slice(5, 10).map(
              (cantidad) => (
                <ComensalButton
                  key={cantidad}
                  value={cantidad}
                  selected={
                    comensales === String(cantidad)
                  }
                  onPress={() =>
                    seleccionarComensales(cantidad)
                  }
                />
              )
            )}

            <Pressable
              onPress={abrirComensalesExtra}
              className="flex-1"
            >
              <View
                className={`h-11 items-center justify-center rounded-xl border ${
                  mostrarComensalesExtra
                    ? 'border-emerald-500 bg-emerald-100'
                    : 'border-emerald-300 bg-emerald-50'
                }`}
              >
                <Ionicons
                  name={
                    mostrarComensalesExtra
                      ? 'checkmark'
                      : 'add'
                  }
                  size={23}
                  color="#059669"
                />
              </View>
            </Pressable>

          </View>

          {/* 11-20 */}
          {mostrarComensalesExtra && (
            <Animated.View
              style={{
                opacity: extraAnim,
                transform: [
                  {
                    translateY: extraAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-6, 0],
                    }),
                  },
                ],
              }}
              className="mt-2 rounded-xl bg-neutral-50 p-2"
            >

              <Text className="mb-1.5 text-xs font-bold text-neutral-700">
                11 a 20
              </Text>

              <View className="flex-row gap-1.5">
                {COMENSALES_11_20.slice(0, 5).map(
                  (cantidad) => (
                    <ComensalButton
                      key={cantidad}
                      value={cantidad}
                      selected={
                        comensales === String(cantidad)
                      }
                      onPress={() =>
                        seleccionarComensales(cantidad)
                      }
                    />
                  )
                )}
              </View>

              <View className="mt-1.5 flex-row gap-1.5">
                {COMENSALES_11_20.slice(5, 10).map(
                  (cantidad) => (
                    <ComensalButton
                      key={cantidad}
                      value={cantidad}
                      selected={
                        comensales === String(cantidad)
                      }
                      onPress={() =>
                        seleccionarComensales(cantidad)
                      }
                    />
                  )
                )}
              </View>

            </Animated.View>
          )}

          {errores.comensales && (
            <Text className="mt-1.5 text-xs font-bold text-red-600">
              {errores.comensales}
            </Text>
          )}

        </View>

        {/* =================================================
            TIPO
        ================================================= */}
        <View className="rounded-2xl bg-white px-3 py-3">

          <View className="mb-2">
            <Text className="text-sm font-bold text-neutral-900">
              Tipo
            </Text>

            <Text className="text-xs text-neutral-600">
              Seleccioná una opción
            </Text>
          </View>

          <View className="flex-row gap-2">

            <TipoButton
              label="VIP"
              icon="diamond-outline"
              selected={tipoLabel === 'VIP'}
              onPress={() =>
                seleccionarTipo('VIP')
              }
            />

            <TipoButton
              label="Estándar"
              icon="restaurant-outline"
              selected={tipoLabel === 'Estándar'}
              onPress={() =>
                seleccionarTipo('Estándar')
              }
            />

            <TipoButton
              label="Movilidad"
              icon="accessibility-outline"
              selected={
                tipoLabel === 'Movilidad reducida'
              }
              onPress={() =>
                seleccionarTipo(
                  'Movilidad reducida'
                )
              }
            />

          </View>

          {errores.tipo && (
            <Text className="mt-1.5 text-xs font-bold text-red-600">
              {errores.tipo}
            </Text>
          )}
</View>
{/* =================================================
    FOTO
================================================= */}
<View className="rounded-2xl bg-white px-3 py-3">

  <View className="mb-2 flex-row items-center justify-between">
    <View>
      <Text className="text-sm font-bold text-neutral-900">
        Foto
      </Text>

      <Text className="text-xs text-neutral-600">
        Tocá para tomar la foto de la mesa
      </Text>
    </View>

    {fotoUri && (
      <View className="flex-row items-center">
        <Ionicons
          name="checkmark-circle"
          size={17}
          color="#059669"
        />

        <Text className="ml-1 text-xs font-bold text-emerald-700">
          Lista
        </Text>
      </View>
    )}
  </View>

  <FotoCaptura
    label="Tomar foto"
    photoUri={fotoUri}
    onPhotoChange={setFotoUri}
    error={errores.foto}
  />

</View>
        {/* =================================================
            GUARDAR
        ================================================= */}
        <View className="pt-1">

          <Button
            title={
              enviando
                ? 'Guardando...'
                : 'Guardar y generar QR'
            }
            onPress={guardar}
            disabled={
              enviando ||
              verificandoNumero ||
              numeroDisponible === false
            }
          />

        </View>

      </View>

    </AuthScreenLayout>
  );
}
