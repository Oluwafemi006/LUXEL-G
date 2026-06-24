from django.apps import AppConfig


class ApiConfig(AppConfig):
    name = 'api'

    def ready(self):
        try:
            from .firebase_init import initialize_firebase
            initialize_firebase()
        except ImportError:
            pass
