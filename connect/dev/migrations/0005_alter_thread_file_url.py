# Generated by Django 4.2.5 on 2024-10-27 12:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dev', '0004_alter_thread_file_url'),
    ]

    operations = [
        migrations.AlterField(
            model_name='thread',
            name='file_url',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
    ]