from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.serializers import ValidationError
from rest_framework import status
from rest_framework.viewsets import ModelViewSet

from .serializers import BrickSerializer, BrickHistorySerializer, StatusSerializer
from ..models import Brick, BrickHistory, Status
from ..constants import *


# View set for Status model
class StatusViewSet(ModelViewSet):
    queryset = Status.objects.all()
    serializer_class = StatusSerializer

# View set for Brick model
class BrickViewSet(ModelViewSet):
    queryset = Brick.objects.all()
    serializer_class = BrickSerializer

    def create(self, request, *args, **kwargs):
        # Create Brick instance
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        brick = serializer.save()  

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['patch'], url_path='modify-status')
    def modify_status(self, request, pk=None):
        try:
            brick = self.get_object()
            status_id = request.data.get('status_id')
            action_type = request.data.get('action_type')

            # Validation for required fields
            if not status_id:
                raise ValidationError({"status_id": "status_id is required."})
            if not action_type:
                raise ValidationError({"action_type": "action_type is required."})
            try:
                status_obj = Status.objects.get(id=status_id)
            except Status.DoesNotExist:
                raise ValidationError({"status_id": f"Status with id {status_id} does not exist."})
            
            # Flag to detect if history logging needed
            valid_change = False

            # Handle add status
            if action_type == ACTION_TYPE_ADD:
                # Only add if not already added
                if status_obj not in brick.statuses.all():
                    brick.statuses.add(status_obj)
                    valid_change = True
            # Handle remove status
            elif action_type == ACTION_TYPE_REMOVE:
                if status_obj in brick.statuses.all():
                    brick.statuses.remove(status_obj)
                    valid_change = True
            # Raise error for other status action types
            else: raise ValidationError({"action_type": f"Invalid action_type \" {action_type}\". Please use {ACTION_TYPE_ADD} or {ACTION_TYPE_REMOVE}\'"})

            # Save the brick and brick history if needed 
            if valid_change:
                brick.save()
                BrickHistory.objects.create(
                    brick=brick, 
                    status=status_obj, 
                    action_type=action_type
                )

            # Return updated data with serializer
            serializer = BrickSerializer(brick)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            # TODO - Validation error cleaning needed here
            raise ValidationError({'detail': f"Brick status modification failed: {str(e)}"})    
        
    @action(detail=True, methods=['get'], url_path='statuses')
    def statuses(self, request, pk=None):
        try:
            brick = self.get_object()
            # Fetch all statuses assigned to a brick, serialize and return
            statuses = brick.statuses.all()
            serializer = StatusSerializer(statuses, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            raise ValidationError({'detail': f"Status retrieval failed: {str(e)}"})

    @action(detail=True, methods=['get'], url_path='history')
    def history(self, request, pk=None):
        try:
            brick = self.get_object()
            # Fetch the history items associated with the brick using ForeignKey
            brick_history = BrickHistory.objects.filter(brick=brick).order_by('timestamp')  # Retrieve history chronologically
            serializer = BrickHistorySerializer(brick_history, many=True, context={'request': request})
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            raise ValidationError({'detail': f"History retrieval failed: {str(e)}"})

"""
TODO: Note - the url_path renaming in the '@action's in this file DO NOT WORK in
the routers used - for some reason, they are using the actual function names.
Need to investigate this. For the time being, make sure that the function name
matches how you want to call it. 
"""