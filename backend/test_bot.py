import requests

url = "http://127.0.0.1:5000/webhook/whatsapp"
telefono_prueba = "whatsapp:+573009998877"

print("==================================================")
print("🤖 INICIANDO CHAT DE PRUEBA CON VERTIZBOT")
print("Escribe 'salir' para terminar la conversación.")
print("==================================================")

while True:
    mensaje = input("\nTú: ")
    if mensaje.lower() == 'salir':
        print("¡Chao, pues! Finalizando prueba.")
        break
        
    payload = {
        "From": telefono_prueba,
        "Body": mensaje
    }
    
    try:
        response = requests.post(url, data=payload)
        if response.status_code == 200:
            print(f"\nVertizBot: {response.text}")
        else:
            print(f"\n[Error {response.status_code}]: {response.text}")
    except Exception as e:
        print("\nNo se pudo conectar con el servidor Flask. ¿Aseguraste de tener bot.py corriendo?", e)