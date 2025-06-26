
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const RecentActivity = () => {
  const activities = [
    {
      id: 1,
      action: 'Document uploaded',
      item: 'Financial Statement Q3',
      user: 'Marco Rossi',
      time: '2 hours ago',
      type: 'upload',
    },
    {
      id: 2,
      action: 'Member added',
      item: 'Team Project Alpha',
      user: 'Sara Bianchi',
      time: '5 hours ago',
      type: 'member',
    },
    {
      id: 3,
      action: 'Task completed',
      item: 'Client Interview Form',
      user: 'Luca Verdi',
      time: '1 day ago',
      type: 'complete',
    },
    {
      id: 4,
      action: 'Review requested',
      item: 'Property Evaluation',
      user: 'Anna Ferrari',
      time: '2 days ago',
      type: 'review',
    },
  ];

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'upload':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Upload</Badge>;
      case 'member':
        return <Badge className="bg-vibe-green-light text-form-green border-form-green/20">Member</Badge>;
      case 'complete':
        return <Badge className="bg-green-50 text-green-700 border-green-200">Complete</Badge>;
      case 'review':
        return <Badge className="bg-accent-yellow text-form-green border-accent-yellow">Review</Badge>;
      default:
        return <Badge variant="outline">Activity</Badge>;
    }
  };

  return (
    <Card className="border border-form-border bg-white">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold text-form-green font-dm-sans">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-medium text-form-green font-inter text-sm">
                  {activity.action}
                </span>
                {getActivityBadge(activity.type)}
              </div>
              <p className="text-sm text-gray-600 font-inter">{activity.item}</p>
              <p className="text-xs text-gray-400 font-inter">by {activity.user}</p>
            </div>
            <span className="text-xs text-gray-400 font-inter">{activity.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
