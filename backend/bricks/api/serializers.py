from rest_framework.serializers import ModelSerializer

from ..models import Brick, BrickHistory, Status


class StatusSerializer(ModelSerializer):
    class Meta:
        model = Status
        fields = ['id', 'name']
        read_only_fields = ['id']

class BrickSerializer(ModelSerializer):
    statuses = StatusSerializer(many=True)

    class Meta: 
        model = Brick
        fields = ['id', 'statuses']
        # read_only_fields = ['id']

    def create(self, validated_data):
        statuses_data = validated_data.pop('statuses', [])
        brick = Brick.objects.create(**validated_data)  

        return brick

    def update(self, instance, validated_data):
        statuses_data = validated_data.pop('statuses', [])
        instance = super().update(instance, validated_data)

        # Clear existing statuses and update
        instance.statuses.clear()
        for status_data in statuses_data:
            status, _ = Status.objects.get_or_create(**status_data)
            instance.statuses.add(status)
        return instance
    
class BrickHistorySerializer(ModelSerializer):
    # Serialize the full status object (not just id!)
    status = StatusSerializer()

    class Meta:
        model = BrickHistory
        fields = ['brick', 'status', 'action_type', 'timestamp']
        # History log should not be editable - all values read only!
        read_only_fields = ['brick', 'status', 'action_type', 'timestamp']