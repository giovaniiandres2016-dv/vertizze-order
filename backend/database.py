import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Inicializar el cliente de Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def obtener_menu_activo():
    """Consulta los productos disponibles en tiempo real desde Supabase."""
    try:
        response = supabase.table('productos').select('*').eq('disponible', True).execute()
        return response.data
    except Exception as e:
        print(f"Error al consultar el menú en Supabase: {e}")
        return []

def registrar_orden(datos_orden):
    """Inserta una nueva orden en la tabla 'ordenes' de Supabase."""
    try:
        response = supabase.table('ordenes').insert(datos_orden).execute()
        return response.data
    except Exception as e:
        print(f"Error al registrar la orden en Supabase: {e}")
        return None