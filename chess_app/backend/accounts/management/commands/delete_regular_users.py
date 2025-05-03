from django.core.management.base import BaseCommand
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = 'Deletes all user accounts except superusers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion without confirmation',
        )

    def handle(self, *args, **options):
        # Count users that will be deleted
        regular_users = User.objects.filter(is_superuser=False)
        count = regular_users.count()
        
        if count == 0:
            self.stdout.write(self.style.SUCCESS('No regular users found to delete.'))
            return

        # Ask for confirmation if not forced
        if not options['force']:
            self.stdout.write(f'You are about to delete {count} regular users.')
            self.stdout.write('Only superusers will be preserved.')
            
            confirm = input('Are you sure you want to proceed? [y/N]: ')
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING('Operation cancelled.'))
                return
        
        # Delete users
        deletion_result = regular_users.delete()
        deleted_count = deletion_result[0]
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {deleted_count} users. Superusers were preserved.')
        )