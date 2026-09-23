# ============================================================================
# ARCHIVO: backend/bot.py (Bot Omnicanal - Vertizze Fast Food con Memoria y Supabase)
# ============================================================================

import os
from dotenv import load_dotenv

# Cargar las variables de entorno desde el archivo .env
load_dotenv()

from flask import Flask, request
from openai import OpenAI
from supabase import create_client, Client

app = Flask(__name__)

# Inicializar clientes leyendo correctamente las variables de entorno
openai_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
supabase: Client = create_client(
    os.environ.get("SUPABASE_URL"), 
    os.environ.get("SUPABASE_KEY")
)

def obtener_menu_supabase():
    """Consulta los productos activos en Supabase para inyectarlos al contexto del bot (RF-16A, RF-21)."""
    try:
        response = supabase.table("productos").select("nombre, descripcion, precio, categoria").eq("disponible", True).execute()
        if response.data:
            menu_texto = "ESTOS SON LOS PRODUCTOS Y PRECIOS ACTUALES DEL MENÚ:\n"
            for p in response.data:
                menu_texto += f"- {p.get('nombre')}: ${p.get('precio')} ({p.get('descripcion', '')})\n"
            return menu_texto
    except Exception as e:
        print("Aviso: No se pudo cargar el menú dinámico de Supabase:", e)
    return "Menú disponible en el sistema general de Vertizze Fast Food."

def generar_system_prompt_dinamico():
    """Combina el prompt base con el menú real obtenido desde Supabase."""
    menu_actual = obtener_menu_supabase()
    
    return f"""
Eres "VertizBot", el asistente virtual conversacional, amable y experto en ventas de "Vertizze Fast Food", un popular restaurante de comida rápida ubicado en Medellín, Colombia. 

### 🍔 MENÚ OFICIAL ACTUALIZADO (Conéctate a estos datos para precios y platos):
{menu_actual}

### 🎯 TU PERSONALIDAD Y TONO:
- **Estilo Paisa Natural:** Hablas con calidez, cercanía y amabilidad genuina. Usas expresiones típicas de Medellín de forma moderada y natural (como "¡Hola, parcero!", "listo pues", "con mucho gusto", "en una", "bien pueda", "¡ágil y con todo el sabor!"). Nunca suenas forzado, robótico ni grotesco.
- **Cero Menús Rígidos:** Jamás le sueltes una lista aburrida o masiva de texto con todo el menú a menos que el cliente te lo pida explícitamente. Actúa como un mesero de barra inteligente: haz preguntas abiertas, recomienda especialidades, guía al usuario y conversa paso a paso.
- **Empático y Resolutivo:** Si el cliente cambia de opinión a mitad de pedido ("mejor quítale la cebolla", "agrégale otra malteada"), adáptate al instante con una sonrisa en las palabras ("¡Hecho, anotado y sin cebolla!").

### 🧠 MANEJO DE MEMORIA HISTÓRICA Y CONTEXTO:
- **Memoria a Largo Plazo:** Tienes acceso al historial completo de este cliente (identificado por su número de celular). 
- **Trato Personalizado:** Si el cliente ya te ha escrito antes, salúdalo por su nombre si lo conoces, recuérdale sus gustos anteriores o hazle sentir que lo reconoces ("¡Hola de nuevo, parcero! Qué bueno tenerte por acá, ¿te vas a pedir la misma hamburguesa de la vez pasada o probamos algo nuevo?").
- **Coherencia Absoluta:** Nunca olvides los detalles que te haya dado en mensajes anteriores. Cada cliente es un mundo independiente y nunca debes confundir sus datos con los de otros chats.

### 📝 FLUJO DE TOMA DE PEDIDOS Y PAGOS:
1. **Identifica el Antojo:** Escucha o lee lo que el cliente quiere de comer o beber basándote estrictamente en los precios del menú oficial.
2. **Personalización:** Pregunta si desea algún adicional, salsa especial o modificar ingredientes.
3. **Datos Clave y Método de Pago:** Cuando el cliente decida cerrar su compra, pídele amablemente sus datos:
   - Nombre completo.
   - Tipo de servicio (Domicilio o para recoger).
   - Dirección exacta (si aplica).
   - **Método de pago (Efectivo o Transferencia).**
4. **⚠️ REGLA CRÍTICA PARA TRANSFERENCIAS:** 
   - Si el cliente elige **Efectivo**, puedes proceder a confirmar el pedido indicando que se pagará al recibir.
   - Si el cliente elige **Transferencia**, **DEBES ESPERAR A QUE ENVÍE EL COMPROBANTE DE PAGO**. Explícale con amabilidad que el pedido queda en pausa corta y solo se mandará a preparar a cocina una vez compartan la captura o confirmación de la transferencia. Jamás des por aprobado un pedido por transferencia sin la validación previa del pago.
5. **Cierre:** Dale un cierre bacano, recuérdale el estimado del tiempo una vez verificado el pago y confírmale que su orden está siendo procesada.
"""

def obtener_historial_cliente(telefono):
    """Consulta en Supabase los últimos mensajes de este número específico."""
    try:
        response = supabase.table("sesiones_bot") \
            .select("historial_mensajes") \
            .eq("telefono", telefono) \
            .execute()
        
        if response.data and len(response.data) > 0:
            historial = response.data[0].get("historial_mensajes", [])
            if historial and historial[0]["role"] == "system":
                historial[0]["content"] = generar_system_prompt_dinamico()
            return historial
    except Exception as e:
        print("Error obteniendo historial desde Supabase:", e)
    
    return [{"role": "system", "content": generar_system_prompt_dinamico()}]

def guardar_historial_cliente(telefono, historial):
    """Actualiza o guarda el historial completo en Supabase para asegurar persistencia total."""
    try:
        supabase.table("sesiones_bot").upsert({
            "telefono": telefono,
            "historial_mensajes": historial,
            "actualizado_en": "now()"
        }, on_conflict="telefono").execute()
    except Exception as e:
        print("Error guardando historial en Supabase:", e)

@app.route("/webhook/whatsapp", methods=["POST"])
def webhook_whatsapp():
    telefono_remitente = request.form.get("From")  # Ej: whatsapp:+573001112233
    mensaje_usuario = request.form.get("Body")

    if not telefono_remitente or not mensaje_usuario:
        return "Faltan datos en la petición", 400

    # 1. Recuperar memoria a largo plazo del cliente (con menú actualizado)
    historial_chat = obtener_historial_cliente(telefono_remitente)

    # 2. Añadir el mensaje actual del usuario
    historial_chat.append({"role": "user", "content": mensaje_usuario})

    try:
        # 3. Llamar a OpenAI con el contexto completo
        respuesta_ia = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=historial_chat,
            temperature=0.7
        )

        texto_respuesta = respuesta_ia.choices[0].message.content

        # 4. Añadir la respuesta de la IA al historial
        historial_chat.append({"role": "assistant", "content": texto_respuesta})

        # 5. Guardar la sesión actualizada en Supabase
        guardar_historial_cliente(telefono_remitente, historial_chat)

        return str(texto_respuesta), 200

    except Exception as e:
        print("Error al comunicarse con OpenAI:", e)
        return "Ocurrió un error procesando tu mensaje.", 500

if __name__ == "__main__":
    app.run(port=5000, debug=True)