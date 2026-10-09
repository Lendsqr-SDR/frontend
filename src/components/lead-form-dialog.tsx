import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLeadMutation, useUpdateLeadMutation } from "@/services/leads/leads.queries";
import {
  LEAD_STATUSES,
  LEAD_TEMPERATURES,
  type Lead,
  type LeadInput,
  type LeadStatus,
  type LeadTemperature,
} from "@/types/leads/leads.types";

const emptyLead = (): LeadInput => ({
  company: "",
  contactPerson: "",
  role: "",
  email: "",
  phone: "",
  linkedin: "",
  country: "",
  city: "",
  website: "",
  companyType: "",
  status: "Not Contacted",
  temperature: "Cold",
  followUpNeeded: false,
  notes: "",
  lastContacted: null,
  nextFollowUp: null,
});

function toLeadInput(lead: Lead): LeadInput {
  const { id: _id, createdAt: _createdAt, ...input } = lead;
  return input;
}

function FieldInput({
  label,
  name,
  value,
  onChange,
  required = false,
  type = "text",
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={`lead-${name}`}>{label}</Label>
      <Input
        id={`lead-${name}`}
        name={name}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        maxLength={maxLength}
        placeholder={placeholder}
      />
    </div>
  );
}

export function LeadFormDialog({ lead, trigger }: { lead?: Lead; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<LeadInput>(() => (lead ? toLeadInput(lead) : emptyLead()));
  const createLead = useCreateLeadMutation();
  const updateLead = useUpdateLeadMutation();
  const isPending = createLead.isPending || updateLead.isPending;

  useEffect(() => {
    if (open) setForm(lead ? toLeadInput(lead) : emptyLead());
  }, [lead, open]);

  const setField = <K extends keyof LeadInput>(key: K, value: LeadInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      if (lead) {
        await updateLead.mutateAsync({ id: lead.id, patch: form });
        toast.success("Lead details updated");
      } else {
        await createLead.mutateAsync(form);
        toast.success("Lead added");
      }
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save lead.");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{lead ? "Edit lead details" : "Add a lead"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(event) => void onSubmit(event)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <FieldInput
                label="Company"
                name="company"
                value={form.company}
                onChange={(value) => setField("company", value)}
                required
                maxLength={200}
              />
              <FieldInput
                label="Company type"
                name="company-type"
                value={form.companyType}
                onChange={(value) => setField("companyType", value)}
                required
                maxLength={100}
                placeholder="Microfinance bank"
              />
              <FieldInput
                label="Contact person"
                name="contact-person"
                value={form.contactPerson}
                onChange={(value) => setField("contactPerson", value)}
                maxLength={200}
              />
              <FieldInput
                label="Role"
                name="role"
                value={form.role}
                onChange={(value) => setField("role", value)}
                maxLength={200}
              />
              <FieldInput
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={(value) => setField("email", value)}
              />
              <FieldInput
                label="Phone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(value) => setField("phone", value)}
                maxLength={50}
              />
              <FieldInput
                label="LinkedIn URL"
                name="linkedin"
                type="url"
                value={form.linkedin}
                onChange={(value) => setField("linkedin", value)}
                maxLength={500}
                placeholder="https://linkedin.com/in/..."
              />
              <FieldInput
                label="Website"
                name="website"
                type="url"
                value={form.website}
                onChange={(value) => setField("website", value)}
                maxLength={500}
                placeholder="https://example.com"
              />
              <FieldInput
                label="Country"
                name="country"
                value={form.country}
                onChange={(value) => setField("country", value)}
                required
                maxLength={100}
              />
              <FieldInput
                label="City"
                name="city"
                value={form.city}
                onChange={(value) => setField("city", value)}
                maxLength={100}
              />
              <div className="space-y-2">
                <Label htmlFor="lead-status">Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(value) => setField("status", value as LeadStatus)}
                >
                  <SelectTrigger id="lead-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-temperature">Lead temperature</Label>
                <Select
                  value={form.temperature}
                  onValueChange={(value) =>
                    setField("temperature", value as LeadTemperature)
                  }
                >
                  <SelectTrigger id="lead-temperature">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_TEMPERATURES.map((temperature) => (
                      <SelectItem key={temperature} value={temperature}>
                        {temperature}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-follow-up-needed">Follow-up needed</Label>
                <Select
                  value={form.followUpNeeded ? "yes" : "no"}
                  onValueChange={(value) => {
                    const followUpNeeded = value === "yes";
                    setField("followUpNeeded", followUpNeeded);
                    if (!followUpNeeded) setField("nextFollowUp", null);
                  }}
                >
                  <SelectTrigger id="lead-follow-up-needed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lead-next-follow-up">Next follow-up</Label>
                <Input
                  id="lead-next-follow-up"
                  type="date"
                  value={form.nextFollowUp ?? ""}
                  onChange={(event) => {
                    const date = event.target.value || null;
                    setField("nextFollowUp", date);
                    if (date) setField("followUpNeeded", true);
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-notes">Notes</Label>
              <Textarea
                id="lead-notes"
                value={form.notes}
                onChange={(event) => setField("notes", event.target.value)}
                maxLength={10000}
                rows={4}
                placeholder="Additional information about this lead"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving..." : lead ? "Save changes" : "Add lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
