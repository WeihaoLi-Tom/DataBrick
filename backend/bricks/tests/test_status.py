from rest_framework.test import APIClient, APITestCase
from rest_framework import status as http_status
from django.urls import reverse

from ..constants import ACTION_TYPE_ADD, ACTION_TYPE_REMOVE
from ..models import Brick, Status, BrickHistory


class BrickStatusTests(APITestCase):
    def setUp(self):
        self.client = APIClient()

        # Create a brick and statuses for testing
        self.brick = Brick.objects.create(id=1)
        self.status1 = Status.objects.create(name="Test Status 1")
        self.status2 = Status.objects.create(name="Test Status 2")
        
        # Modify status url query
        self.modify_status_url = reverse('brick-modify-status', kwargs={'pk': self.brick.id})


    def test_add_status_to_brick(self):
        """
        Test adding an unassigned status to a brick, ensuring history created.
        Can take data for a modify_status patch request via `data`.
        """
        # Perform a PATCH request to add the status
        data = {
            'action_type': ACTION_TYPE_ADD,
            'status_id': self.status1.id
        }
        response = self.client.patch(self.modify_status_url, data, format='json')

        # Check that the request was successful
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)

        # Verify the status has been added to the brick
        self.assertIn(self.status1, self.brick.statuses.all())

        # Verify that a BrickHistory entry has been created
        history_item = BrickHistory.objects.filter(brick=self.brick, status=self.status1, action_type=ACTION_TYPE_ADD).first()
        self.assertIsNotNone(history_item)
        self.assertEqual(history_item.status.name, 'Test Status 1')
        self.assertEqual(history_item.action_type, ACTION_TYPE_ADD)

    def test_add_duplicate_status_to_brick(self):
        """
        Test adding a duplicate assigned status to a brick, ensuring no history 
        item is created.
        """
        # First, add a status to the brick to set up the duplicated add test
        self.brick.statuses.add(self.status1)

        # Perform second PATCH request to add the status
        data = {
            'action_type': ACTION_TYPE_ADD,
            'status_id': self.status1.id
        }
        response = self.client.patch(self.modify_status_url, data, format='json')

        # Check that the request was successful (legal action)
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)

        # Verify the status is still assigned to the brick
        self.assertIn(self.status1, self.brick.statuses.all())

        # Verify that no BrickHistory entry has been created for the patch
        history_items = BrickHistory.objects.filter(brick=self.brick, status=self.status1, action_type=ACTION_TYPE_ADD)
        self.assertIsNotNone(history_items)
        self.assertTrue(len(history_items) == 0)


    def test_remove_status_from_brick(self):
        """
        Test removing an assigned status from a brick, ensuring history created.
        """
        # First, add a status to the brick to set up the remove test
        self.brick.statuses.add(self.status2)
        BrickHistory.objects.create(brick=self.brick, status=self.status2, action_type=ACTION_TYPE_ADD)

        # Perform the PATCH request to remove the status
        data = {
            'action_type': ACTION_TYPE_REMOVE,
            'status_id': self.status2.id
        }
        response = self.client.patch(self.modify_status_url, data, format='json')

        # Check that the request was successful
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)

        # Verify the status has been removed from the brick
        self.assertNotIn(self.status2, self.brick.statuses.all())

        # Verify original history is still present after the removal
        original_item = BrickHistory.objects.filter(brick=self.brick, status=self.status2, action_type=ACTION_TYPE_ADD).first()
        self.assertIsNotNone(original_item)
        self.assertEqual(original_item.status.name, 'Test Status 2')
        self.assertEqual(original_item.action_type, ACTION_TYPE_ADD)

        # Verify that a new BrickHistory entry has been created for the removal
        history_item = BrickHistory.objects.filter(brick=self.brick, status=self.status2, action_type=ACTION_TYPE_REMOVE).first()
        self.assertIsNotNone(history_item)
        self.assertEqual(history_item.status.name, 'Test Status 2')
        self.assertEqual(history_item.action_type, ACTION_TYPE_REMOVE)

    def test_remove_absent_status_from_brick(self):
        """
        Test removing an absent status from a brick ensuring no history created.
        """
        # Verify the status is not assigned to the brick
        self.assertNotIn(self.status2, self.brick.statuses.all())

        # Perform the PATCH request to remove the status
        data = {
            'action_type': ACTION_TYPE_REMOVE,
            'status_id': self.status2.id
        }
        response = self.client.patch(self.modify_status_url, data, format='json')

        # Check that the request was successful
        self.assertEqual(response.status_code, http_status.HTTP_200_OK)

        # Verify the status is still not assigned to the brick
        self.assertNotIn(self.status2, self.brick.statuses.all())

        # Verify that no BrickHistory entry has been created for the patch
        history_items = BrickHistory.objects.filter(brick=self.brick, status=self.status2, action_type=ACTION_TYPE_REMOVE)
        self.assertIsNotNone(history_items)
        self.assertTrue(len(history_items) == 0)