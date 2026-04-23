"use client";
import { PageHeader } from "@/components/VaultShell";
import { CredentialForm } from "@/components/CredentialForm";
import { Plus } from "@/components/icons";

export default function NewCredentialPage() {
  return (
    <>
      <PageHeader
        title="Add credential"
        subtitle="Every field is encrypted in your browser before it ever touches disk."
        icon={Plus}
      />
      <div className="card p-7">
        <CredentialForm />
      </div>
    </>
  );
}
