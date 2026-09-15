FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update -qq \
    && apt-get install -y -qq --no-install-recommends \
      acl \
      aide \
      bash \
      cron \
      curl \
      fail2ban \
      gawk \
      iproute2 \
      iptables \
      iputils-ping \
      less \
      man-db \
      nano \
      net-tools \
      openssh-server \
      passwd \
      procps \
      psmisc \
      rsyslog \
      sed \
      sudo \
      vim-tiny \
      wget \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -s /bin/bash student \
    && echo "student:lab123" | chpasswd \
    && mkdir -p /etc/sudoers.d /run/sshd /home/student/lab-work \
    && echo "student ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/student \
    && chmod 0440 /etc/sudoers.d/student \
    && chown -R student:student /home/student

WORKDIR /home/student

CMD ["tail", "-f", "/dev/null"]
