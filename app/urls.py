from django.urls import path, include
from rest_framework import routers

from app import views

router=routers.DefaultRouter()
router.register(r'sensores',views.SensoresViewSet)
urlpatterns=[
    path('metrica/', views.metrica),
    path('ver/',include(router.urls))
]


#router=routers.DefaultRouter()
#router.register(r'sensores',views.SensoresViewSet)
#urlpatterns=[
 #   path('',include(router.urls))
#]