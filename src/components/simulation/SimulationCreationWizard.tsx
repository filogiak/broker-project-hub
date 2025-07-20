import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, Users, FileText, Phone, Mail, User, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

const applicantCountEnum = z.enum(['solo', 'duo']);

const participantSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  phone: z.string().optional(),
  participantDesignation: z.enum(['applicant_one', 'applicant_two', 'solo_applicant']),
});

const simulationFormSchema = z.object({
  name: z.string().min(3, {
    message: "Simulation name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  applicantCount: applicantCountEnum,
  projectContactName: z.string().min(2, {
    message: "Project contact name must be at least 2 characters.",
  }),
  projectContactEmail: z.string().email({
    message: "Invalid email address.",
  }),
  projectContactPhone: z.string().optional(),
  participants: z.array(participantSchema).min(1, {
    message: "At least one participant is required.",
  }),
});

type SimulationFormData = z.infer<typeof simulationFormSchema>;

interface SimulationCreationWizardProps {
  onCreateSimulation: (data: SimulationFormData) => Promise<void>;
  isCreating?: boolean;
  creationProgress?: {
    step: string;
    message: string;
    progress: number;
    formLinksStatus?: 'completed' | 'pending' | 'partial' | 'failed';
  };
}

const SimulationCreationWizard: React.FC<SimulationCreationWizardProps> = ({ 
  onCreateSimulation, 
  isCreating = false,
  creationProgress
}) => {
  const [applicantCount, setApplicantCount] = useState<"solo" | "duo">("solo");

  const { register, handleSubmit, watch, control, formState: { errors } } = useForm<SimulationFormData>({
    resolver: zodResolver(simulationFormSchema),
    defaultValues: {
      applicantCount: "solo",
      participants: [{ participantDesignation: 'solo_applicant' } as any],
    },
  });

  const watchApplicantCount = watch("applicantCount");

  const onSubmit = async (data: SimulationFormData) => {
    await onCreateSimulation(data);
  };

  const renderApplicantFields = (applicantNumber: 1 | 2, designation: 'applicant_one' | 'applicant_two') => (
    <div key={applicantNumber} className="space-y-2">
      <h3 className="text-lg font-medium">Applicant {applicantNumber}</h3>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`firstName${applicantNumber}`}>First Name</Label>
            <Input type="text" id={`firstName${applicantNumber}`}  {...register(`participants.${applicantNumber - 1}.firstName`)} />
            {errors.participants?.[applicantNumber - 1]?.firstName && (
              <p className="text-sm text-red-500">{errors.participants[applicantNumber - 1].firstName?.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor={`lastName${applicantNumber}`}>Last Name</Label>
            <Input type="text" id={`lastName${applicantNumber}`}  {...register(`participants.${applicantNumber - 1}.lastName`)} />
            {errors.participants?.[applicantNumber - 1]?.lastName && (
              <p className="text-sm text-red-500">{errors.participants[applicantNumber - 1].lastName?.message}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`email${applicantNumber}`}>Email</Label>
            <Input type="email" id={`email${applicantNumber}`}  {...register(`participants.${applicantNumber - 1}.email`)} />
            {errors.participants?.[applicantNumber - 1]?.email && (
              <p className="text-sm text-red-500">{errors.participants[applicantNumber - 1].email?.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor={`phone${applicantNumber}`}>Phone (Optional)</Label>
            <Input type="tel" id={`phone${applicantNumber}`}  {...register(`participants.${applicantNumber - 1}.phone`)} />
            {errors.participants?.[applicantNumber - 1]?.phone && (
              <p className="text-sm text-red-500">{errors.participants[applicantNumber - 1].phone?.message}</p>
            )}
          </div>
        </div>
        <input type="hidden" {...register(`participants.${applicantNumber - 1}.participantDesignation`)} value={designation} />
      </div>
    </div>
  );

  const getProgressIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'partial':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin" />;
    }
  };

  const getProgressMessage = (progress?: typeof creationProgress) => {
    if (!progress) return null;

    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          {getProgressIcon(progress.formLinksStatus)}
          <span className="text-sm font-medium">{progress.step}</span>
        </div>
        <Progress value={progress.progress} className="w-full" />
        <p className="text-sm text-muted-foreground">{progress.message}</p>
        
        {progress.formLinksStatus && progress.formLinksStatus !== 'completed' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700">Form Links Status</span>
            </div>
            <p className="text-xs text-blue-600">
              {progress.formLinksStatus === 'pending' && "Form links are being generated in the background"}
              {progress.formLinksStatus === 'partial' && "Some form links failed - you can retry later"}
              {progress.formLinksStatus === 'failed' && "Form link generation failed - you can retry later"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Simulation Name</Label>
        <Input type="text" id="name" placeholder="Simulation Name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea id="description" placeholder="Description" {...register("description")} />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div>
        <Label>Number of Applicants</Label>
        <RadioGroup defaultValue="solo" className="flex flex-col space-y-1" onValueChange={(value) => setApplicantCount(value as "solo" | "duo")}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="solo" id="solo" {...register("applicantCount")} />
            <Label htmlFor="solo">Solo Applicant</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="duo" id="duo" {...register("applicantCount")} />
            <Label htmlFor="duo">Two Applicants</Label>
          </div>
        </RadioGroup>
        {errors.applicantCount && (
          <p className="text-sm text-red-500">{errors.applicantCount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectContactName">Project Contact Name</Label>
        <Input type="text" id="projectContactName" placeholder="Project Contact Name" {...register("projectContactName")} />
        {errors.projectContactName && (
          <p className="text-sm text-red-500">{errors.projectContactName.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectContactEmail">Project Contact Email</Label>
        <Input type="email" id="projectContactEmail" placeholder="Project Contact Email" {...register("projectContactEmail")} />
        {errors.projectContactEmail && (
          <p className="text-sm text-red-500">{errors.projectContactEmail.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="projectContactPhone">Project Contact Phone (Optional)</Label>
        <Input type="tel" id="projectContactPhone" placeholder="Project Contact Phone" {...register("projectContactPhone")} />
        {errors.projectContactPhone && (
          <p className="text-sm text-red-500">{errors.projectContactPhone.message}</p>
        )}
      </div>

      {applicantCount === "solo" ? (
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Applicant Information</h2>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstNameSolo">First Name</Label>
                <Input type="text" id="firstNameSolo" {...register("participants.0.firstName")} />
                {errors.participants?.[0]?.firstName && (
                  <p className="text-sm text-red-500">{errors.participants[0].firstName?.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastNameSolo">Last Name</Label>
                <Input type="text" id="lastNameSolo" {...register("participants.0.lastName")} />
                {errors.participants?.[0]?.lastName && (
                  <p className="text-sm text-red-500">{errors.participants[0].lastName?.message}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emailSolo">Email</Label>
                <Input type="email" id="emailSolo" {...register("participants.0.email")} />
                {errors.participants?.[0]?.email && (
                  <p className="text-sm text-red-500">{errors.participants[0].email?.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="phoneSolo">Phone (Optional)</Label>
                <Input type="tel" id="phoneSolo" {...register("participants.0.phone")} />
                {errors.participants?.[0]?.phone && (
                  <p className="text-sm text-red-500">{errors.participants[0].phone?.message}</p>
                )}
              </div>
            </div>
            <input type="hidden" {...register("participants.0.participantDesignation")} value="solo_applicant" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Applicants Information</h2>
          {renderApplicantFields(1, 'applicant_one')}
          {renderApplicantFields(2, 'applicant_two')}
        </div>
      )}

      <Button type="submit" disabled={isCreating}>
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Simulation"
        )}
      </Button>
    </form>
  );

  if (isCreating) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Creating Simulation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {getProgressMessage(creationProgress)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Create New Simulation</CardTitle>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Fill in the details to create a new simulation.
          </p>
        </CardContent>
      </CardHeader>
      <CardContent>
        {renderForm()}
      </CardContent>
    </Card>
  );
};

export default SimulationCreationWizard;
