from django.db import models

class Branch(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    type = models.CharField(max_length=50, default='Main')
    location = models.CharField(max_length=150, null=True, blank=True)
    contact = models.CharField(max_length=50, null=True, blank=True)
    code = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        db_table = 'branches'
        verbose_name = 'Branch'
        verbose_name_plural = 'Branches'

    def __str__(self):
        return self.name
