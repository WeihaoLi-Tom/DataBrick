from rest_framework.test import APIClient, APITestCase
from django.urls import reverse

from ..constants import ACTION_TYPE_ADD
from ..models import Brick, Status, BrickHistory


class BrickHistoryTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Create a brick and a status for testing
        self.brick = Brick.objects.create(id=1)
        self.status = Status.objects.create(name="Test Status")
        # Log a history event
        BrickHistory.objects.create(brick=self.brick, status=self.status, action_type=ACTION_TYPE_ADD)

        # Get brick history url query
        self.history_url = reverse('brick-history', kwargs={'pk': self.brick.id})


    def test_get_brick_history(self):
        # Perform the GET request
        response = self.client.get(self.history_url)
        
        # Check that the request was successful
        self.assertEqual(response.status_code, 200)
        
        # Check the response content
        history_data = response.json()
        self.assertEqual(len(history_data), 1)
        self.assertEqual(history_data[0]['status']['name'], 'Test Status')
        self.assertEqual(history_data[0]['action_type'], ACTION_TYPE_ADD)
