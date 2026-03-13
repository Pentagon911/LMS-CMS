from rest_framework import serializers
from .models import*

class pdfserializer(serializers.ModelSerializer):
    class Meta:
        model = Pdf
        fields ={'title'}
