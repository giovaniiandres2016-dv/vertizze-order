from flask import Flask, request, jsonify
from database import obtener_menu_activo, registrar_orden
from twilio.twiml.messaging_response import MessagingResponse

app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "online", "message": "VertizzeOrder Backend funcionando al 100%"})

@app.route("/api/menu", methods=["GET"])
def api_menu():
    menu = obtener_menu_activo()
    return jsonify({"success": True, "data": menu})

@app.route("/webhook/whatsapp", methods=["POST"])
def whatsapp_webhook():
    """Endpoint que recibe los mensajes de WhatsApp enviados por Twilio."""
    incoming_msg = request.form.get('Body', '').strip().lower()
    sender = request.form.get('From', '')
    
    print(f"Mensaje recibido de {sender}: {incoming_msg}")

    resp = MessagingResponse()
    reply = resp.message()

    if "menu" in incoming_msg or "hola" in incoming_msg or "comprar" in incoming_msg:
        menu_items = obtener_menu_activo()
        if menu_items:
            menu_text = "🍔 *Menú Disponible - VertizzeOrder*:\n\n"
            for item in menu_items:
                nombre = item.get('nombre')
                precio = item.get('precio')
                descripcion = item.get('descripcion', '')
                menu_text += f"▪️ *{nombre}* - ${precio:,.0f}\n   _{descripcion}_\n\n"
            menu_text += "Responde con el producto que deseas ordenar."
            reply.body(menu_text)
        else:
            reply.body("¡Hola! En este momento no hay productos activos en el menú.")
    else:
        reply.body("¡Gracias por escribirnos en VertizzeOrder! Escribe 'menu' para ver nuestros productos disponibles.")

    return str(resp), 200, {'Content-Type': 'application/xml'}

if __name__ == "__main__":
    app.run(debug=True, port=5000)