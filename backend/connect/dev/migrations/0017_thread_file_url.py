# Generated by Django 4.2.5 on 2024-09-19 17:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dev', '0016_rename_file_message_file_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='thread',
            name='file_url',
            field=models.FileField(blank=True, null=True, upload_to='uploads/'),
        ),
    ]
