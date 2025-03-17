from rest_framework import  serializers
from .models import Lectura_sen

class SensoresSerializer(serializers.ModelSerializer):
    class Meta:
        model= Lectura_sen
        fields= ['pulsaciones','oxigenacion','temperatura',"fecha_hora"]