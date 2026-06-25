// Central site + homepage content. Edit this file to update the homepage.

export const SITE = {
  title: "Kunal Damame",
  author: "Kunal Damame",
  email: "kunaldamame27@gmail.com",
  url: "https://kunaldamame.dev",
  description:
    "Kunal Damame — systems & backend engineer at Nutanix. Distributed systems, software-defined networking, and Linux kernel-to-userspace performance.",
};

export const HOME = {
  name: "Kunal Damame",
  role: "Software Engineer — Systems & Networking",
  location: "Bangalore, India",
  status: "building distributed firewalls @ Nutanix",
  tagline:
    "I build distributed firewalls and kernel-to-userspace data pipelines at Nutanix. I like the layer where Go meets the Linux kernel.",
  stack: [
    { label: "languages", value: "Go · Java · C · Python" },
    { label: "networking", value: "OVS/OVN · Netfilter · Netlink · nf_conntrack" },
    { label: "systems", value: "Linux · Kubernetes · distributed systems" },
    { label: "data & msg", value: "Kafka · Cassandra · MySQL · Redis" },
  ],
  summary: [
    "I'm a software engineer who works close to the metal — distributed systems, software-defined networking, and core backend infrastructure. Most of my time is spent where high-level system design meets low-level kernel behavior.",
    "Today I'm at Nutanix building the distributed firewall and microsegmentation platform: a Go policy engine that programs OVN ACLs, plus high-throughput telemetry pipelines bridging the Linux kernel and userspace. Before that, at Paytm, I built high-scale merchant onboarding and KYC systems in Java/Spring Boot.",
  ],
  currently: [
    "Engineering Flow Network Security at Nutanix — distributed firewall enforcement across AHV hypervisor clusters.",
    "Designing a next-gen, Go-native policy engine that compiles rules into OVN (Open Virtual Network) ACLs.",
    "Tuning kernel-to-userspace telemetry (nf_conntrack → Netlink) for lossless observability at scale.",
  ],
  competencies: [
    {
      name: "Go",
      detail:
        "Concurrency-heavy systems: lock-free, double-buffered queues, reconciliation loops, and a policy/rule framework built from scratch.",
    },
    {
      name: "Linux Networking & SDN",
      detail:
        "OVS/OVN, Netfilter/TPROXY, nf_conntrack, Netlink sockets, ACLs, and the OVS/OVN datapath — L2/L3/L7 security.",
    },
    {
      name: "Distributed Systems",
      detail:
        "High-scale rule enforcement, minimal-rebalance priority algorithms, ENOBUFS mitigation, and lossless event pipelines.",
    },
    {
      name: "Java & Backend",
      detail:
        "Spring Boot microservices, REST/gRPC, Kafka, MySQL/Cassandra/Redis — built for high-throughput KYC & onboarding.",
    },
  ],
  experience: [
    {
      role: "Member of Technical Staff - 2",
      org: "Nutanix",
      period: "Dec 2024 — Present",
      stack: "Go · Python · SDN · OVS/OVN · Linux",
      points: [
        "Flow Network Security: building core components of Nutanix's distributed firewall and microsegmentation platform for granular traffic control across VMs in AHV clusters.",
        "Kernel-to-userspace telemetry: optimized high-throughput event pipelines bridging the Linux kernel (nf_conntrack) and userspace analytics via Netlink — using lock-free, double-buffered queues to mitigate ENOBUFS drops.",
        "Next-gen policy engine (Go): designed the rule framework that programs OVN ACLs for high-scale distributed enforcement, replacing the legacy policy model.",
        "Engineered a custom minimal-rebalance priority algorithm that cut rule churn and reduced rule realization time by ~30%.",
      ],
    },
    {
      role: "Backend Software Engineer",
      org: "Paytm",
      period: "Jun 2023 — Dec 2024",
      stack: "Java · Spring Boot · Microservices · Kafka",
      points: [
        "Core platform team for merchant onboarding & KYC across high-throughput distributed systems; cut fetch-lead API latency by 25%.",
        "ONDC data onboarding: built the MID discovery component (first of its kind internally), improving operating revenue by ₹50 crore.",
        "Built a document audit-archiving system in the QC framework that reduced L1 escalations by 25%.",
      ],
    },
  ],
  education: [
    {
      school: "Indian Institute of Technology (IIT) Palakkad",
      degree: "B.Tech, Electrical Engineering",
      period: "2019 — 2023",
    },
  ],
  links: [
    { label: "GitHub", url: "https://github.com/Koder2727" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/kunal-damame/" },
    { label: "Email", url: "mailto:kunaldamame27@gmail.com" },
  ],
};
